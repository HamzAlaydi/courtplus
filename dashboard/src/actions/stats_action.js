import statsService from "../service/stats.service";

export const getTenantStats = async (params) =>
  await statsService.getTenantStats(params);
