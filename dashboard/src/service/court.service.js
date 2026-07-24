import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance"; // ✅ Use axiosInstance
const API_URL = "/courts"; // No need to manually append API_URL_COMMON (handled in axiosInstance)

class CourtService {
  createCourt(courtData) {
    return apiRequest({
      method: "post",
      url: API_URL,
      data: courtData,
      customHeaders: authHeader(),
    });
  }

  getCourts(params) {
    return apiRequest({
      method: "get",
      url: API_URL,
      params,
      customHeaders: authHeader(),
    });
  }

  getCourt(courtId) {
    return apiRequest({
      method: "get",
      url: `${API_URL}/${courtId}`,
      customHeaders: authHeader(),
    });
  }

  getCourtAvailabilty({ courtId, params }) {
    return apiRequest({
      method: "get",
      url: `${API_URL}/${courtId}/availability`,
      customHeaders: authHeader(),
      params,
    });
  }

  updateCourt(courtId, courtData) {
    return apiRequest({
      method: "patch",
      url: `${API_URL}/${courtId}`,
      data: courtData,
      customHeaders: authHeader(),
    });
  }

  deleteCourt(courtId) {
    return apiRequest({
      method: "delete",
      url: `${API_URL}/${courtId}`,
      customHeaders: authHeader(),
    });
  }
}

const courtService = new CourtService();

export default courtService;
