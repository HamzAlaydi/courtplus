import subscriptionService from "../service/subscription.service";

export const createCheckoutSession = async (data) =>
  await subscriptionService.createCheckoutSession(data);
