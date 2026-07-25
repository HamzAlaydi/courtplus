import React, { useMemo, useState } from "react";
import { PlayCircleFilled } from "@ant-design/icons";

/**
 * Unified media gallery for the court details page: a 16:9 stage showing the
 * selected item with a thumbnail strip below (images + video, video thumb has
 * a play badge). Renders nothing when there is no media.
 */
export default function CourtMediaGallery({ images = [], video = null }) {
  const items = useMemo(() => {
    const list = images.map((url, index) => ({
      type: "image",
      url,
      key: `image-${index}`,
    }));
    if (video) list.push({ type: "video", url: video, key: "video" });
    return list;
  }, [images, video]);

  const [activeKey, setActiveKey] = useState(null);

  if (items.length === 0) return null;

  const active = items.find((item) => item.key === activeKey) || items[0];

  return (
    <div className="media-gallery">
      <div className="media-stage">
        {active.type === "video" ? (
          <video
            key={active.key}
            src={active.url}
            controls
            className="media-stage-media media-stage-video"
          />
        ) : (
          <img
            src={active.url}
            alt="Court"
            className="media-stage-media media-stage-image"
          />
        )}
      </div>

      {items.length > 1 && (
        <div className="media-thumbs">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`media-thumb ${
                item.key === active.key ? "media-thumb-active" : ""
              }`}
              onClick={() => setActiveKey(item.key)}
            >
              {item.type === "video" ? (
                <span className="media-thumb-video">
                  <PlayCircleFilled className="media-thumb-play" />
                </span>
              ) : (
                <img src={item.url} alt="Court" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
