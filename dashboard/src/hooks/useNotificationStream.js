import { useEffect, useRef } from "react";
import { API_URL_COMMON } from "../service/http.common";

/**
 * Live notification events from GET /notifications/stream (Server-Sent
 * Events) — the bell badge changes the moment a notification is created,
 * instead of on the next 30-second poll.
 *
 * Implemented over fetch rather than EventSource: EventSource cannot send
 * the Authorization header, and the alternative — the token in the URL —
 * would leak it into proxy and browser history logs.
 *
 * Reconnects with backoff on any drop (server restart, network, the server's
 * own 15-minute stream lifetime) and always reads the CURRENT token from
 * storage when it does, so a refreshed token is picked up automatically.
 * Polling on the caller's side stays in place as the fallback.
 */
export default function useNotificationStream(onEvent, { enabled = true } = {}) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!enabled) return undefined;

    let stopped = false;
    let controller = null;
    let retryTimer = null;
    let attempt = 0;

    const schedule = (ms) => {
      if (stopped) return;
      const delay = ms ?? Math.min(30000, 1000 * 2 ** attempt++);
      retryTimer = setTimeout(connect, delay);
    };

    const connect = async () => {
      if (stopped) return;
      const token = localStorage.getItem("accessToken");
      if (!token) {
        schedule(5000);
        return;
      }

      controller = new AbortController();
      try {
        const res = await fetch(`${API_URL_COMMON}/notifications/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (res.status === 401 || res.status === 403) {
          // Token expired: the axios refresh flow replaces it on the next
          // API call; try again later with whatever is in storage then.
          schedule(15000);
          return;
        }
        if (!res.ok || !res.body) {
          schedule();
          return;
        }

        attempt = 0;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // SSE frames are separated by a blank line.
        for (;;) {
          const { value, done } = await reader.read();
          if (done || stopped) break;
          buffer += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const event = parseFrame(frame);
            if (event) handler.current?.(event);
          }
        }
      } catch {
        // AbortError on unmount, or a network drop — both fall through.
      }
      schedule();
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      controller?.abort();
    };
  }, [enabled]);
}

function parseFrame(frame) {
  let type = "message";
  const dataLines = [];
  for (const line of frame.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) type = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
  }
  if (dataLines.length === 0) return null;
  const raw = dataLines.join("\n");
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }
  return { type, data };
}
