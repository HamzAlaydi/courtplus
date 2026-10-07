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

  // Price impact of one more court (and whether the card is charged now), so
  // the Add Court form can ask for confirmation before creating a paid unit.
  getCourtAvailability() {
    return apiRequest({
      method: "get",
      url: `${API_URL}/court-availability`,
      customHeaders: authHeader(),
    });
  }

  getBranchAvailability() {
    return apiRequest({
      method: "get",
      url: `${API_URL}/branch-availability`,
      customHeaders: authHeader(),
    });
  }

  // Confirm the subscription straight from Stripe (with the Checkout session
  // id on return, or by tenant lookup). Makes the success page self-healing
  // instead of depending on webhook delivery timing.
  syncSubscription({ sessionId } = {}) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/sync`,
      data: sessionId ? { sessionId } : {},
      customHeaders: authHeader(),
    });
  }
}

const subscriptionService = new SubscriptionService();

export default subscriptionService;
