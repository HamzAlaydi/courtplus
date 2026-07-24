import { axiosInstance } from "apis";
import { ApiResponse, endPoints } from "utils";
import {
  AuthenticationResponse,
  CheckUsernameRequest,
  CheckUsernameResponse,
  LoginRequest,
  LoginResponse,
  SendCodeRequest,
  SignupRequest,
  SocialLoginRequest,
} from "./auth.types";
import { getUniqueId } from "react-native-device-info";

export const loginService = async (data: LoginRequest) => {
  const deviceId = await getUniqueId();
  const response = await axiosInstance.post<LoginResponse>(
    endPoints.login,
    data,
    {
      headers: {
        "x-device-id": deviceId,
      },
    }
  );
  if (response.data.OK) {
    return response.data;
  } else return null;
};

export const sendCodeService = async (data: SendCodeRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    endPoints.sendCode,
    data
  );
  return response.data.OK;
};

export const socialLoginService = async (data: SocialLoginRequest) => {
  const deviceId = await getUniqueId();
  const response = await axiosInstance.post<LoginResponse>(
    endPoints.socialLogin,
    data,
    {
      headers: {
        "x-device-id": deviceId,
      },
    }
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const signupService = async (data: SignupRequest) => {
  const deviceId = await getUniqueId();

  const response = await axiosInstance.post<AuthenticationResponse>(
    endPoints.signup,
    data,
    {
      headers: {
        "x-device-id": deviceId,
      },
    }
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};

export const checkUsernameService = async (data: CheckUsernameRequest) => {
  const response = await axiosInstance.post<CheckUsernameResponse>(
    endPoints.checkUsername,
    data
  );
  if (response.data.OK) {
    return response.data;
  }
  return null;
};
