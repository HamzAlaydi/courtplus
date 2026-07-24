import { axiosInstance } from "apis";
import { GetUsersRequest, GetUsersResponse } from "./users.types";
import { ApiResponse, endPoints } from "utils";
import { User } from "models";

export const getUsers = async ({
  page,
  pageSize = 10,
  search = "",
}: GetUsersRequest) => {
  const response = await axiosInstance.get<GetUsersResponse>(endPoints.users, {
    params: {
      page,
      pageSize,
      search,
    },
  });
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};

export const follow = async ({ id }: { id: string }) => {
  const response = await axiosInstance.post<ApiResponse>(
    `${endPoints.friendships}/${id}/${endPoints.follow}`
  );
  return response.data.OK;
};

export const getUserById = async ({ id }: { id: string }) => {
  const response = await axiosInstance.get<User & ApiResponse>(
    `${endPoints.users}/${id}`
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const unfollow = async ({ id }: { id: string }) => {
  const response = await axiosInstance.post<ApiResponse>(
    `${endPoints.friendships}/${id}/${endPoints.unfollow}`
  );
  return response.data.OK;
};
