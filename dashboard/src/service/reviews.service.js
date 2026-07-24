import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/reviews";

class reviewsService {
  getAllReviews(params) {
    console.log("==================");
    console.log(params);
    return apiRequest({
      method: "get",
      url: API_URL,
      customHeaders: authHeader(),
      params: params,
    });
  }
}

const reviewsServiceInstance = new reviewsService();

export default reviewsServiceInstance;
