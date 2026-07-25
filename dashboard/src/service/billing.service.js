import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/billing";

class BillingService {
  getOverview() {
    return apiRequest({
      method: "get",
      url: `${API_URL}/overview`,
      customHeaders: authHeader(),
    });
  }

  getInvoices() {
    return apiRequest({
      method: "get",
      url: `${API_URL}/invoices`,
      customHeaders: authHeader(),
    });
  }

  createPortalSession(returnUrl) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/portal`,
      data: { returnUrl },
      customHeaders: authHeader(),
    });
  }

  getPendingCharges() {
    return apiRequest({
      method: "get",
      url: `${API_URL}/pending-charges`,
      customHeaders: authHeader(),
    });
  }
}

const billingService = new BillingService();

export default billingService;
