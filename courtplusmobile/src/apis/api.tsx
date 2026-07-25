import axios from "axios";
import { useAppStore } from "store";
import {
  ApiResponse,
  clearCache,
  endPoints,
  getApiErrorMessage,
  getNetworkErrorMessage,
} from "utils";
import { navigationRef } from "navigation/types";
import { CommonActions } from "@react-navigation/native";

const CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

const instance = axios.create({
  baseURL: endPoints.baseUrl,
  timeout: CONFIG.TIMEOUT,
});

instance.interceptors.request.use((config) => {
  const { userTokens } = useAppStore.getState();

  if (userTokens.accessToken) {
    config.headers.Authorization = `Bearer ${userTokens.accessToken}`;
  }

  return config;
});

const handleError = (error: any) => {
  // Backend errors arrive as `{ statusCode, code }`; network/timeout errors
  // have no response at all. Both must become a clear localized message —
  // never a raw code, never "Internal Server Error".
  const code = error?.response?.data?.code ?? null;
  return {
    status: error?.response?.status,
    data: {
      OK: false,
    },
    message: error?.response
      ? getApiErrorMessage(code)
      : getNetworkErrorMessage(),
  };
};

const handleLogout = () => {
  const { setUserTokens } = useAppStore.getState();
  setUserTokens({
    accessToken: "",
    refreshToken: "",
  });
  clearCache();
  navigationRef.current?.dispatch(
    CommonActions.reset({ index: 1, routes: [{ name: "OnboardingStack" }] })
  );
};

const refreshToken = async (
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const response = await axios.post(endPoints.refreshToken, null, {
      baseURL: endPoints.baseUrl,
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    return {
      accessToken: response.data?.accessToken,
      refreshToken: response.data?.refreshToken,
    };
  } catch (error) {
    throw new Error("Token refresh failed");
  }
};

instance.interceptors.response.use(
  (response) => {
    if (response.status === 200 || response.status === 201) {
      return {
        ...response,
        data: {
          ...response.data,
          OK: true,
        },
      };
    }
    return response as ApiResponse;
  },
  async (error) => {
    const { setUserTokens, userTokens } = useAppStore.getState();
    const errorResponse = handleError(error);

    if (error.response?.status === 401 && userTokens.accessToken) {
      const originalRequest = error.response.config;
      if (!originalRequest) {
        return handleError(error);
      }
      try {
        const newTokens = await refreshToken(userTokens.refreshToken);
        setUserTokens(newTokens);
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return instance(originalRequest);
      } catch (_) {
        return handleLogout();
      }
    }

    return Promise.reject(errorResponse);
  }
);

export default instance;
