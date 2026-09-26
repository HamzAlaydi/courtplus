import subscriptionService from "../service/subscription.service";

export const createCheckoutSession = async (data) =>
  await subscriptionService.createCheckoutSession(data);

export const syncSubscription = async (data) =>
  await subscriptionService.syncSubscription(data);

export const getCourtAvailability = async () =>
  await subscriptionService.getCourtAvailability();

export const getBranchAvailability = async () =>
  await subscriptionService.getBranchAvailability();
