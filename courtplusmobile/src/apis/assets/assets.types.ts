import { ApiResponse, ImageData } from "utils";

export interface UploadImageRequest {
  data: ImageData;
  type: "avatarAssetId" | "coverAssetId" | "image";
  onUploadProgress?: (progress: number) => void;
}

export interface UploadImageResponse extends ApiResponse {
  s3: {
    url: string;
    fields: {
      key: string;
      bucket: string;
      "X-Amz-Algorithm": string;
      "X-Amz-Credential": string;
      "X-Amz-Date": string;
      Policy: string;
      "X-Amz-Signature": string;
    };
    key: string;
  };
  id: string;
  assetUrl: string;
}
