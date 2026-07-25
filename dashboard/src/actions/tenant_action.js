import tenantService from "../service/tenant.service";

export const getTenant = async () => await tenantService.getTenant();

export const updateTenant = async (tenantData) =>
  await tenantService.updateTenant(tenantData);

export const requestUnsuspend = async (message) =>
  await tenantService.requestUnsuspend(message);
