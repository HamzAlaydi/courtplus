import { axiosInstance, uploadImageToBucket } from "apis";
import { ApiResponse, endPoints } from "utils";
import { User } from "models";
import {
  AddSportsRequest,
  EditProfileRequest,
  GetFriendshipsRequest,
  GetFriendshipsResponse,
  GetPostsRequest,
  GetPostsResponse,
  UpdatePhoneRequest,
  VerifyPhoneRequest,
} from "./profile.types";
import { UploadImageRequest } from "../assets/assets.types";

export const getProfile = async () => {
  const response = await axiosInstance.get<User & ApiResponse>(
    endPoints.profile
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const getFriendships = async ({
  page,
  pageSize = 10,
  search = "",
  ...params
}: GetFriendshipsRequest) => {
  const response = await axiosInstance.get<GetFriendshipsResponse>(
    endPoints.friendships,
    {
      params: {
        page,
        pageSize,
        search,
        ...params,
      },
    }
  );
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};

export const getPosts = async ({
  page,
  pageSize = 10,
  userId,
  ...params
}: GetPostsRequest) => {
  const response = await axiosInstance.get<GetPostsResponse>(endPoints.posts, {
    params: {
      page,
      pageSize,
      ...(userId && { userId }),
      ...params,
    },
  });
  if (response.data.OK) {
    return response.data.items;
  }
  return [];
};

export const updatePhone = async (data: UpdatePhoneRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    endPoints.updatePhone,
    data
  );
  return response.data.OK;
};
export const verifyPhone = async (data: VerifyPhoneRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    endPoints.verifyPhone,
    data
  );
  return response.data.OK;
};

export const logout = async () => {
  const response = await axiosInstance.post<ApiResponse>(endPoints.logout);
  return response.data.OK;
};

export const editProfile = async ({ user }: EditProfileRequest) => {
  const response = await axiosInstance.patch<User & ApiResponse>(
    endPoints.profile,
    user
  );
  if (response.data.OK) {
    return response;
  }
  return null;
};

export const uploadImage = async (uploadData: UploadImageRequest) => {
  const result = await uploadImageToBucket(uploadData);
  if (result) {
    return await editProfile({
      user: {
        [uploadData.type]: result,
      },
      onUploadProgress: uploadData.onUploadProgress,
    });
  }
  return null;
};

export const deleteSport = async (id: string) => {
  const response = await axiosInstance.delete<ApiResponse>(
    `${endPoints.sports}/${id}`
  );
  return response.data.OK;
};

export const addSport = async (data: AddSportsRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    endPoints.sports,
    data
  );
  return response.data.OK;
};

export const deleteAccount = async () => {
  const response = await axiosInstance.delete<ApiResponse>(endPoints.profile);
  return response.data.OK;
};
