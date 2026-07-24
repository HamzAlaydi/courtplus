import { axiosInstance, CourtsResponse } from "apis";
import {
  BranchRequestIdRequest,
  CourtRequestIdRequest,
  CourtsRequest,
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
  const response = await axiosInstance.get<CourtsResponse>(endPoints.courts, {
    params: {
      pageSize,
      ...params,
    },
    headers: {
      ["X-Location"]: currentLocation,
    },
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
