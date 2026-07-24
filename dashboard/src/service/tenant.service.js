import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/tenants";

class TenantService {
  getTenant() {
    return apiRequest({
      method: "get",
      url: API_URL,
      customHeaders: authHeader(),
    });
  }
}

const tenantService = new TenantService();

export default tenantService;
