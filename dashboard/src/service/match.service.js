import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/bookings";

class MatchService {
  createMatch(data) {
    return apiRequest({
      method: "post",
      url: API_URL,
      data,
      customHeaders: authHeader(),
    });
  }

  getMatches(params) {
    console.log(params);
    return apiRequest({
      method: "get",
      url: API_URL,
      params,
      customHeaders: authHeader(),
    });
  }

  getMatchById(id) {
    return apiRequest({
      method: "get",
      url: `${API_URL}/${id}`,
      customHeaders: authHeader(),
    });
  }

  cancelMatchById(id, reason) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/${id}/cancel`,
      data: reason ? { reason } : {},
      customHeaders: authHeader(),
    });
  }
}

const matchService = new MatchService();

export default matchService;
