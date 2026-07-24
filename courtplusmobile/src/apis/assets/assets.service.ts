import { convertImageType, endPoints, isAndroid } from "utils";
import { UploadImageRequest, UploadImageResponse } from "./assets.types";
import { axiosInstance } from "apis";
import axios from "axios";

export const uploadImageToBucket = async ({
  data,
  type,
}: UploadImageRequest) => {
  try {
    const imageType = convertImageType(type);
    const response = await axiosInstance.post<UploadImageResponse>(
      endPoints.signedUrl,
      {
        type: imageType,
      }
    );
    if (response.data.OK) {
      const { s3 } = response.data;
      const formData = new FormData();
      Object.entries(s3.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("Content-Type", "image/jpeg");

      formData.append("file", {
        name: data.fileName,
        type: data.type,
        uri: isAndroid ? data.uri : data.uri.replace("file://", ""),
      });

      const uploadResponse = await axios.post(s3.url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (uploadResponse.status === 204) {
        return response.data.id;
      }
      return null;
    }
    return null;
  } catch (error) {
    return null;
  }
};
