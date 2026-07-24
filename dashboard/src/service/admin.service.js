import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance"; // ✅ Use axiosInstance
const API_URL = "/admin"; // No need for API_URL_COMMON, handled in axiosInstance

class AdminService {
  getUsers(params) {
    return apiRequest({
      method: "get",
      url: `${API_URL}/users`,
      params: params,
      customHeaders: authHeader(),
    });
  }

  blockUser(id) {
    return apiRequest({
      method: "patch",
      url: `${API_URL}/users/${id}/block`,
      customHeaders: authHeader(),
    });
  }

  unBlockUser(id) {
    return apiRequest({
      method: "patch",
      url: `${API_URL}/users/${id}/unblock`,
      customHeaders: authHeader(),
    });
  }
}

const adminService = new AdminService();

export default adminService;
