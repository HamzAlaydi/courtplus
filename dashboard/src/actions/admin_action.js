import adminService from "../service/admin.service";

export const getUsers = async (params) => await adminService.getUsers(params);
export const blockUser = async (id) => await adminService.blockUser(id);
export const unBlockUser = async (id) => await adminService.unBlockUser(id);
