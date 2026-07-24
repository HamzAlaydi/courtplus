import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/stats";

class StatsService {
  getTenantStats(params) {
    return apiRequest({
      method: "get",
      url: `${API_URL}/tenant`,
      params,
      customHeaders: authHeader(),
    });
  }
}

const statsService = new StatsService();

export default statsService;
