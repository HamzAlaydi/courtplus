import payoutService from "../service/payout.service";

export const getPayoutBalance = async () => await payoutService.getBalance();
export const getPayoutAccountStatus = async () => await payoutService.getAccountStatus();
export const startPayoutOnboarding = async (country) => await payoutService.startOnboarding(country);
export const requestPayout = async (amount) => await payoutService.requestPayout(amount);
export const listPayouts = async (params) => await payoutService.listPayouts(params);
export const listPayoutTransactions = async (params) => await payoutService.listTransactions(params);
export const getPayoutSettings = async () => await payoutService.getSettings();
export const updatePayoutSettings = async (data) => await payoutService.updateSettings(data);
