import { useEffect, useRef } from "react";
import { API_URL, tokenStore } from "@/api/client";

export interface StreamEvent {
  type: "count" | "notification" | "ping" | string;
  data: {
    unseenCount?: number;
    notification?: {
      id?: string;
      type: string;
      data?: Record<string, unknown>;
      createdAt: string;
    };
    [key: string]: unknown;
  };
}

/**
 * Live notification events from GET /notifications/stream (Server-Sent
 * Events): the bell badge changes the moment a notification is created
 * instead of on the next 30-second poll.
 *
 * fetch instead of EventSource so the Bearer token travels in a header, not
 * the URL. Reconnects with backoff on any drop and re-reads the current
 * token each time, so a refreshed token is picked up automatically. The
 * caller's polling stays as the fallback.
 */
export function useNotificationStream(
  onEvent: (event: StreamEvent) => void,
  enabled = true,
): void {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!enabled) return undefined;

    let stopped = false;
    let controller: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const schedule = (ms?: number) => {
      if (stopped) return;
      const delay = ms ?? Math.min(30_000, 1000 * 2 ** attempt++);
      retryTimer = setTimeout(connect, delay);
    };

    const connect = async () => {
      if (stopped) return;
      const token = tokenStore.accessToken;
      if (!token) {
        schedule(5000);
        return;
      }

      controller = new AbortController();
      try {
        const res = await fetch(`${API_URL}/notifications/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
          cache: "no-store",
          signal: controller.signal,
        });

        if (res.status === 401 || res.status === 403) {
          schedule(15_000);
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

        for (;;) {
          const { value, done } = await reader.read();
          if (done || stopped) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const event = parseFrame(frame);
            if (event) handler.current(event);
          }
        }
      } catch {
        // AbortError on unmount or a network drop: reconnect below.
      }
      schedule();
    };

    void connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      controller?.abort();
    };
  }, [enabled]);
}

function parseFrame(frame: string): StreamEvent | null {
  let type = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) type = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
  }
  if (dataLines.length === 0) return null;
  const raw = dataLines.join("\n");
  let data: StreamEvent["data"];
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }
  return { type, data };
}
