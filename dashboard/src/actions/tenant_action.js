import tenantService from "../service/tenant.service";

export const getTenant = async () => await tenantService.getTenant();
