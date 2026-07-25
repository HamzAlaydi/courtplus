import bookingService from "../service/booking.service";

export const getBookings = async (params) =>
  await bookingService.getBookings(params);
