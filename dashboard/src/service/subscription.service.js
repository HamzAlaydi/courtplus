import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/subscriptions";

class SubscriptionService {
  createCheckoutSession({ branchCount = 1, successUrl, cancelUrl }) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/checkout`,
      data: { branchCount, successUrl, cancelUrl },
      customHeaders: authHeader(),
    });
  }
}

const subscriptionService = new SubscriptionService();

export default subscriptionService;
