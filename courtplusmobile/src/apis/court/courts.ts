import { axiosInstance } from "apis";
import { ApiResponse, endPoints } from "utils";
import {
  BookmarkRequest,
  CourtRequestIdRequest,
  CourtsRequestParams,
  CourtsResponse,
  GetBookmarkRequest,
  GetBookmarkResponse,
  GetCourtAvailabilityRequest,
  GetCourtAvailabilityResponse,
  ReviewsRequestParams,
  ReviewsResponse,
} from "./types";
import { Court } from "models";

export const getCourts = async ({
  pageSize = 10,
  currentLocation,
  ...params
}: CourtsRequestParams) => {
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

export const getCourtById = async ({ id }: CourtRequestIdRequest) => {
  const response = await axiosInstance.get<Court & ApiResponse>(
    `${endPoints.courts}/${id}`
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const addBookmark = async (data: BookmarkRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    endPoints.bookmarks,
    data
  );
  if (response.data.OK) {
    return true;
  }
  return false;
};

export const deleteBookmark = async (data: BookmarkRequest) => {
  const response = await axiosInstance.delete<ApiResponse>(
    `${endPoints.bookmarks}/${data.resourceId}`
  );
  if (response.data.OK) {
    return true;
  }
  return false;
};

export const getBookmarks = async ({
  pageSize = 10,
  type = ["court", "branch"],
  ...params
}: GetBookmarkRequest) => {
  const response = await axiosInstance.get<GetBookmarkResponse>(
    endPoints.bookmarks,
    {
      params: {
        pageSize,
        type: type.join(","),
        ...params,
      },
    }
  );
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};

export const getCourtAvailability = async ({
  id,
  date,
  month,
}: GetCourtAvailabilityRequest) => {
  const response = await axiosInstance.get<GetCourtAvailabilityResponse>(
    `${endPoints.courts}/${id}/availability`,
    {
      params: {
        date,
        month,
      },
    }
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const getReviews = async ({
  courtId,
  page,
  pageSize = 10,
}: ReviewsRequestParams) => {
  const response = await axiosInstance.get<ReviewsResponse>(endPoints.reviews, {
    params: {
      courtId,
      pageSize,
      page,
    },
  });
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};
