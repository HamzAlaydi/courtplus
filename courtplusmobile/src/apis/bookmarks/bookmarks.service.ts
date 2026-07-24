import { axiosInstance } from "apis";
import {
  GetBookmarkRequest,
  GetBookmarkResponse,
  PostBookmarkRequest,
  PostBookmarkResponse,
} from "./bookmarks.types";
import { ApiResponse, endPoints } from "utils";

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

export const postBookmark = async (data: PostBookmarkRequest) => {
  const response = await axiosInstance.post<PostBookmarkResponse>(
    endPoints.bookmarks,
    data
  );
  return response.data.OK;
};

export const deleteBookmark = async (id: string) => {
  const response = await axiosInstance.delete<ApiResponse>(
    `${endPoints.bookmarks}/${id}`
  );
  return response.data.OK;
};
