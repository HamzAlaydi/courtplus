import staffService from "../service/staff.service";

export const getMe = async () => await staffService.getMe();

export const updateMe = async (data) => await staffService.updateMe(data);

export const getAllStaff = async (params) =>
  await staffService.getAllStaff(params);

export const getAllStaffInvitations = async () =>
  await staffService.getAllStaffInvitations();

export const revokeInvitation = async (id) =>
  await staffService.revokeInvitation(id);

export const sendInvitation = async (data) =>
  await staffService.sendInvitation(data);

export const changePassword = async (data) =>
  await staffService.changePassword(data);

export const changeEmail = async (data) => await staffService.changeEmail(data);

export const verifyEmail = async (data) => await staffService.verifyEmail(data);

export const cancelEmailChange = async () =>
  await staffService.cancelEmailChange();

export const assignStaffToBranch = async (data) => {
  const res = await staffService.assignStaffToBranch(data);
  return res;
};

export const unassignStaffFromBranch = async (data) =>
  await staffService.unassignStaffFromBranch(data);

export const updateStaffRole = async (id, data) =>
  await staffService.updateStaffRole(id, data);

export const deleteAcc = async (data) => await staffService.deleteAcc(data);

export const deleteAccVerify = async (data) =>
  await staffService.deleteAccVerify(data);
