import branchService from "../service/branch.service";

export const createBranch = async (branchData) =>
  await branchService.createBranch(branchData);

export const getBranches = async (params) =>
  await branchService.getBranches(params);

export const getBranch = async (branchId) =>
  await branchService.getBranch(branchId);

export const updateBranch = async (branchId, branchData) =>
  await branchService.updateBranch(branchId, branchData);

export const deleteBranch = async (branchId) => {
  return await branchService.deleteBranch(branchId);
};
