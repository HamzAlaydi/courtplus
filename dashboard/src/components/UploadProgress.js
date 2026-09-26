import React from "react";
import { Progress } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

/**
 * In-place upload indicator for the media dropzones.
 *
 * A court video can be 100 MB. Before this, the upload ran with no feedback at
 * all — the dropzone looked untouched, so a slow upload was indistinguishable
 * from a click that did nothing, and vendors would click again and start a
 * second upload.
 *
 * `percent` is the real byte progress reported by the XHR (see
 * uploadImageToS3). It can legitimately sit at 100 for a while on large files
 * while S3 finishes writing, so the copy switches to "finishing up" rather
 * than appearing stuck at 100%.
 */
export default function UploadProgress({ percent, label }) {
  const finishing = percent >= 100;

  return (
    <div className="upload-progress">
      <LoadingOutlined className="upload-progress__spinner" spin />
      <span className="upload-progress__label">{label}</span>
      <Progress
        percent={percent}
        size="small"
        status="active"
        showInfo={false}
        strokeColor="#c0ff42"
        trailColor="#e3e8e6"
        className="upload-progress__bar"
      />
      <span className="upload-progress__percent">
        {finishing ? "…" : `${percent}%`}
      </span>
    </div>
  );
}
