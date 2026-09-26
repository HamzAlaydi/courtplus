import { axiosInstance, EventsRequest, EventsResponse } from "apis";
import { ApiResponse, endPoints } from "utils";
import {
  BookingsRequest,
  BookingsResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  EnterMatchRequest,
  EventsPage,
  JoinMatchRequest,
  JoinMatchResponse,
  OpenBookingsRequest,
  PayMatchRequest,
  PayMatchResponse,
  RespondJoinRequestRequest,
  RespondMatchRequest,
  RespondMatchResponse,
  CancelMatchRequest,
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

// Returns the page object rather than just the items: the caller needs the
// pagination block to know whether another page exists. Guessing from "the
// page looked full" re-requested page 1 forever on this endpoint.
export const getMatchEvents = async ({
  id,
  page = 1,
  pageSize = 20,
}: EventsRequest): Promise<EventsPage> => {
  const response = await axiosInstance.get<EventsResponse>(
    `${endPoints.bookings}/${id}/events`,
    {
      params: {
        page,
        pageSize,
      },
    }
  );
  if (response.data.OK) {
    return {
      items: response.data.items ?? [],
      pagination: response.data.pagination,
    };
  }
  return { items: [] };
};

export const respondMatch = async ({ id, ...data }: RespondMatchRequest) => {
  const response = await axiosInstance.post<RespondMatchResponse>(
    `${endPoints.bookings}/${id}/respond`,
    data
  );
  return response.data.OK;
};

// The host's side of a join request: `/join` only queues the request when the
// match does not auto-accept, and until this the app had no way to answer one.
export const respondJoinRequest = async ({
  id,
  ...data
}: RespondJoinRequestRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    `${endPoints.bookings}/${id}/request/respond`,
    data
  );
  return response.data.OK;
};

// Becoming a participant of someone else's open match. `/pay` cannot do this
// — it 404s for anyone not already in the booking — so the app previously had
// no way at all for a stranger to take a free seat.
export const joinMatch = async ({ id }: JoinMatchRequest) => {
  const response = await axiosInstance.post<JoinMatchResponse>(
    `${endPoints.bookings}/${id}/join`
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
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

// Creator: cancels the booking (every paid seat is refunded). Other
// participant: leaves the match. The app had no way to do either before.
export const cancelMatch = async ({ id, ...data }: CancelMatchRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    `${endPoints.bookings}/${id}/cancel`,
    data
  );
  return response.data.OK;
};

export const enterMatch = async ({ id }: EnterMatchRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    `${endPoints.bookings}/${id}/enter`
  );
  return response.data.OK;
};
