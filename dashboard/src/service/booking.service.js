import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/bookings";

class BookingService {
  getBookings(params) {
    return apiRequest({
      method: "get",
      url: API_URL,
      params,
      customHeaders: authHeader(),
    });
  }
}

const bookingService = new BookingService();

export default bookingService;
