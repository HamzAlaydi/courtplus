import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/payouts";

/**
 * Vendor payouts: balance, Stripe Connect onboarding, withdrawal requests.
 * The backend had all of this for months; the dashboard never called it,
 * so no vendor could ever be paid.
 */
class PayoutService {
  getBalance() {
    return apiRequest({ method: "get", url: `${API_URL}/balance`, customHeaders: authHeader() });
  }

  getAccountStatus() {
    return apiRequest({ method: "get", url: `${API_URL}/account/status`, customHeaders: authHeader() });
  }

  // Returns { url } of the hosted Stripe onboarding page.
  startOnboarding(country) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/account/onboard`,
      data: country ? { country } : {},
      customHeaders: authHeader(),
    });
  }

  // amount in major units (e.g. 250 = 250.00 SAR)
  requestPayout(amount) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/request`,
      data: { amount },
      customHeaders: authHeader(),
    });
  }

  getSettings() {
    return apiRequest({ method: "get", url: `${API_URL}/settings`, customHeaders: authHeader() });
  }

  // Saving an IBAN switches the tenant to the manual (bank transfer) rail,
  // which is the only way to be paid where Stripe Connect cannot onboard.
  updateSettings(data) {
    return apiRequest({ method: "put", url: `${API_URL}/settings`, data, customHeaders: authHeader() });
  }

  listPayouts(params) {
    return apiRequest({ method: "get", url: API_URL, params, customHeaders: authHeader() });
  }

  listTransactions(params) {
    return apiRequest({ method: "get", url: `${API_URL}/transactions`, params, customHeaders: authHeader() });
  }
}

const payoutService = new PayoutService();
export default payoutService;
