import customersService from "../service/customers.service";

export const getCustomersByUsername = async ({ params }) =>
  await customersService.getCustomersByUsername({ params });
