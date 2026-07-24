import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance"; // ✅ Use axiosInstance
const API_URL = "/branches"; // No need to include API_URL_COMMON (handled in axiosInstance)

class BranchService {
  createBranch(branchData) {
    return apiRequest({
      method: "post",
      url: API_URL,
      data: branchData,
      customHeaders: authHeader(),
    });
  }

  getBranches(params) {
    return apiRequest({
      method: "get",
      url: API_URL,
      params,
      customHeaders: authHeader(),
    });
  }

  getBranch(branchId) {
    return apiRequest({
      method: "get",
      url: `${API_URL}/${branchId}`,
      customHeaders: authHeader(),
    });
  }

  updateBranch(branchId, branchData) {
    return apiRequest({
      method: "patch",
      url: `${API_URL}/${branchId}`,
      data: branchData,
      customHeaders: authHeader(),
    });
  }

  deleteBranch(branchId) {
    return apiRequest({
      method: "delete",
      url: `${API_URL}/${branchId}`,
      customHeaders: authHeader(),
    });
  }
}

const branchService = new BranchService();

export default branchService;
