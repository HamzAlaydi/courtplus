import { useUserStore } from "store";
import { axiosInstance, CourtsResponse } from "apis";
import {
  BranchRequestIdRequest,
  CourtRequestIdRequest,
  CourtsRequest,
  DEFAULT_COURTS_RADIUS,
  GetCourtAvailabilityRequest,
  GetCourtAvailabilityResponse,
} from "./court.types";
import { ApiResponse, endPoints } from "utils";
import { Branch, Court } from "models";

export const getCourts = async ({
  pageSize = 10,
  currentLocation,
  ...params
}: CourtsRequest) => {
  // Only geo-filter (and send the X-Location header) when BOTH coordinates
  // are valid numbers — a partial location breaks the backend location parser.
  const hasLocation =
    Number.isFinite(params.lat) && Number.isFinite(params.lng);
  const response = await axiosInstance.get<CourtsResponse>(endPoints.courts, {
    params: {
      pageSize,
      // radius is required by the backend whenever coordinates are sent
      ...(hasLocation
        ? {
            // km chosen in the location filter, else the default
            radius: (() => {
              const km = useUserStore.getState().location?.radius;
              return km && km > 0 ? Math.round(km * 1000) : DEFAULT_COURTS_RADIUS;
            })(),
          }
        : {}),
      ...params,
    },
    ...(hasLocation
      ? { headers: { ["X-Location"]: `${params.lat},${params.lng}` } }
      : {}),
  });
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};

export const getCourtDetails = async ({ id }: CourtRequestIdRequest) => {
  const response = await axiosInstance.get<Court & ApiResponse>(
    `${endPoints.courts}/${id}`
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const getBranchById = async ({
  id,
  includeCourts = true,
}: BranchRequestIdRequest) => {
  const response = await axiosInstance.get<Branch & ApiResponse>(
    `${endPoints.branches}/${id}`,
    {
      params: {
        includeCourts,
      },
    }
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const getCourtAvailability = async (
  data: GetCourtAvailabilityRequest
) => {
  const response = await axiosInstance.get<GetCourtAvailabilityResponse>(
    `${endPoints.courts}/${data.id}/availability`,
    {
      params: {
        date: data.date,
        month: data.month,
      },
    }
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};
