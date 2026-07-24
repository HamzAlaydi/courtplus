import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/notifications";

class NotificationService {
  getNotifications(params) {
    return apiRequest({
      method: "get",
      url: API_URL,
      params,
      customHeaders: authHeader(),
    });
  }

  markNotificationRead(id) {
    return apiRequest({
      method: "patch",
      url: `${API_URL}/${id}/read`,
      customHeaders: authHeader(),
    });
  }

  markAllNotificationsSeen() {
    return apiRequest({
      method: "post",
      url: `${API_URL}/all/mark-seen`,
      customHeaders: authHeader(),
    });
  }

  getUnseenCount() {
    return apiRequest({
      method: "get",
      url: `${API_URL}/unseen-count`,
      customHeaders: authHeader(),
    });
  }
}

const notificationService = new NotificationService();

export default notificationService;
