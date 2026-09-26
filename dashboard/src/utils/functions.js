import { uploadAssets } from "../actions/assets_action";

export const uploadImageToS3 = async (file, type, onProgress) => {
  const res = await uploadAssets({ type });
  // console.log(res); // returns { s3, id }
  const { s3, id: assetId, assetUrl } = res;
  const { url, fields } = s3;

  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value?.toString().trim());
  });

  // Append Content-Type if not already present (required by the S3 policy:
  // backend signs a `starts-with` condition on Content-Type, e.g. "video/").
  // Some browsers can't sniff a MIME for certain video containers, so fall
  // back to the family wildcard base instead of sending an empty value.
  if (!formData.has("Content-Type")) {
    const fallback = type?.includes("video") ? "video/mp4" : "image/jpeg";
    formData.append("Content-Type", file.type || fallback);
  }

  formData.append("file", file); // must be last

  // XHR rather than fetch: fetch cannot report upload progress, and a court
  // video can be 100 MB. Without a percentage the vendor has no way to tell a
  // slow upload from a frozen page. `onProgress` is optional, so the existing
  // callers that do not pass it are unaffected.
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    if (typeof onProgress === "function" && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        // Not every server/browser combination reports a total; fall back to
        // indeterminate rather than dividing by zero.
        if (event.lengthComputable && event.total > 0) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      // S3 returns 204 No Content on a successful POST policy upload.
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    xhr.send(formData);
  });

  return { assetId, assetUrl };
};
