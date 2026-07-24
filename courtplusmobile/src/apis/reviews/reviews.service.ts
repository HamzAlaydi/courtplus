import { axiosInstance } from "apis";
import { ApiResponse, endPoints } from "utils";
import {
  PostReviewRequest,
  ReviewsRequest,
  ReviewsResponse,
} from "./reviews.types";

export const postReview = async (data: PostReviewRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    endPoints.reviews,
    data
  );
  return response.data.OK;
};

export const getReviews = async ({
  page,
  pageSize = 10,
  ...params
}: ReviewsRequest) => {
  const response = await axiosInstance.get<ReviewsResponse>(endPoints.reviews, {
    params: {
      page,
      pageSize,
      ...params,
    },
  });
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};
