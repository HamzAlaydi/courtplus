import billingService from "../service/billing.service";

export const getBillingOverview = async () =>
  await billingService.getOverview();

export const getBillingInvoices = async () =>
  await billingService.getInvoices();

export const createBillingPortal = async (returnUrl) =>
  await billingService.createPortalSession(returnUrl);

export const getPendingCharges = async () =>
  await billingService.getPendingCharges();
