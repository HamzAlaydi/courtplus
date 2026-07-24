import reviewsService from "../service/reviews.service";

export const getAllReviews = async (params) =>
  await reviewsService.getAllReviews(params);
