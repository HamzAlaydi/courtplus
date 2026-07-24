import { axiosInstance, EventsRequest, EventsResponse } from "apis";
import { ApiResponse, endPoints } from "utils";
import {
  BookingsRequest,
  BookingsResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  EnterMatchRequest,
  OpenBookingsRequest,
  PayMatchRequest,
  PayMatchResponse,
  RespondMatchRequest,
  RespondMatchResponse,
} from "./bookings.types";

export const getBookings = async ({
  pageSize = 10,
  ...params
}: BookingsRequest) => {
  const response = await axiosInstance.get<BookingsResponse>(
    endPoints.bookings,
    {
      params: {
        pageSize,
        ...params,
      },
    }
  );

  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};

export const createBooking = async ({
  open = false,
  ...data
}: CreateBookingRequest) => {
  const response = await axiosInstance.post<CreateBookingResponse>(
    endPoints.bookings,
    {
      open,
      ...data,
    }
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const getOpenBookings = async ({
  pageSize = 10,
  ...params
}: OpenBookingsRequest) => {
  const response = await axiosInstance.get<BookingsResponse>(
    endPoints.openBookings,
    {
      params: {
        pageSize,
        ...params,
      },
    }
  );
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};

export const getMatchEvents = async ({ id }: EventsRequest) => {
  const response = await axiosInstance.get<EventsResponse>(
    `${endPoints.bookings}/${id}/events`
  );
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};

export const respondMatch = async ({ id, ...data }: RespondMatchRequest) => {
  const response = await axiosInstance.post<RespondMatchResponse>(
    `${endPoints.bookings}/${id}/respond`,
    data
  );
  return response.data.OK;
};

export const payMatch = async ({ id }: PayMatchRequest) => {
  const response = await axiosInstance.post<PayMatchResponse>(
    `${endPoints.bookings}/${id}/pay`
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const enterMatch = async ({ id }: EnterMatchRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    `${endPoints.bookings}/${id}/enter`
  );
  return response.data.OK;
};
