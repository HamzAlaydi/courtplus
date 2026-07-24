import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/users";

class customerService {
  getCustomersByUsername({ params }) {
    return apiRequest({
      method: "get",
      url: API_URL,
      customHeaders: authHeader(),
      params: params,
    });
  }
}

const customersService = new customerService();

export default customersService;
