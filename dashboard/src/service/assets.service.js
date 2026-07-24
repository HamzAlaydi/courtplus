import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance"; // ✅ Use axiosInstance
const API_URL = "/assets"; // No need for API_URL_COMMON, handled in axiosInstance

class AssetsService {
  // uploadAssets(assetsData) {
  //   return apiRequest({
  //     method: "post",
  //     url: `${API_URL}/upload`,
  //     data: { file: assetsData },
  //     customHeaders: authHeader("multipart/form-data"),
  //   });
  // }
  uploadAssets(assetsData) {
    console.log(assetsData);
    return apiRequest({
      method: "post",
      url: `${API_URL}/signed-url`,
      data: assetsData,
      customHeaders: authHeader(),
    });
  }
}

const assetsService = new AssetsService();

export default assetsService;
