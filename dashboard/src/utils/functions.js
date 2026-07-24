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

  // Append Content-Type if not already present
  if (!formData.has("Content-Type")) {
    formData.append("Content-Type", file.type);
  }

  formData.append("file", file); // must be last

  const uploadResponse = await fetch(url, {
    method: "POST",
    body: formData,
  });

  console.log(uploadResponse);

  if (!uploadResponse.ok) {
    throw new Error("Upload failed");
  }

  return { assetId, assetUrl };
};
