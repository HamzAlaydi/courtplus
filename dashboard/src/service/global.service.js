import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance"; // ✅ Use axiosInstance
const API_URL = "/"; // No need to manually append API_URL_COMMON (handled in axiosInstance)

class GlobalService {
  getPosts(params) {
    return apiRequest({
      method: "get",
      url: API_URL + "posts",
      params,
      customHeaders: authHeader(),
    });
  }
}

const globalService = new GlobalService();

export default globalService;
