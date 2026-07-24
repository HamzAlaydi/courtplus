import authHeader from "./auth-header";
import { apiRequest } from "./axiosInstance";
const API_URL = "/staff";

class staffService {
  getMe() {
    return apiRequest({
      method: "get",
      url: API_URL + "/me",
      customHeaders: authHeader(),
    });
  }

  updateMe(data) {
    return apiRequest({
      method: "patch",
      url: API_URL + "/me",
      data: data,
      customHeaders: authHeader(),
    });
  }

  getAllStaff(branchId) {
    return apiRequest({
      method: "get",
      url: branchId ? `${API_URL}?branchId=${branchId}` : API_URL,
      customHeaders: authHeader(),
    });
  }

  getAllStaffInvitations() {
    return apiRequest({
      method: "get",
      url: API_URL + "/invitations",
      customHeaders: authHeader(),
    });
  }

  revokeInvitation(id) {
    return apiRequest({
      method: "post",
      url: API_URL + `/invitations/${id}/revoke`,
      customHeaders: authHeader(),
    });
  }

  sendInvitation(data) {
    return apiRequest({
      method: "post",
      url: API_URL + `/invite`,
      data: data,
      customHeaders: authHeader(),
    });
  }

  changePassword(data) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/me/change-password`,
      data: data,
      customHeaders: authHeader(),
    });
  }

  changeEmail(data) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/me/email/change`,
      data: data,
      customHeaders: authHeader(),
    });
  }

  verifyEmail(data) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/me/email/verify`,
      data: data,
      customHeaders: authHeader(),
    });
  }

  cancelEmailChange() {
    return apiRequest({
      method: "post",
      url: `${API_URL}/me/email/cancel`,
      customHeaders: authHeader(),
    });
  }

  assignStaffToBranch(data) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/assign`,
      data: data,
      customHeaders: authHeader(),
    });
  }

  deleteAcc(data) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/me/delete`,
      data: data,
      customHeaders: authHeader(),
    });
  }

  deleteAccVerify(data) {
    return apiRequest({
      method: "post",
      url: `${API_URL}/me/delete/verify`,
      data: data,
      customHeaders: authHeader(),
    });
  }
}

const staffServiceInstance = new staffService();

export default staffServiceInstance;
