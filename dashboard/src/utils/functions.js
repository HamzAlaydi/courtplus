import { uploadAssets } from "../actions/assets_action";

export const uploadImageToS3 = async (file, type) => {
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

  const uploadResponse = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error("Upload failed");
  }

  return { assetId, assetUrl };
};
