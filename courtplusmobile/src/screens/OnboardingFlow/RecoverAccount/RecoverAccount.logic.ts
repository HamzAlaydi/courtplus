import {
  RouteProp,
  StackActions,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import {
  useLoginMutation,
  useSocialLoginMutation,
  registerNotificationToken,
} from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import {
  OnboardingStackNavigationProp,
  OnboardingStackParamList,
} from "navigation/types";
import { useAppStore } from "store";

export const useRecoverAccount = () => {
  const route =
    useRoute<RouteProp<OnboardingStackParamList, "RecoverAccount">>();
  const toggleLoading = useAppStore((state) => state.toggleLoading);
  const { loginMutation } = useLoginMutation();
  const { mutateAsync: socialLoginMutation } = useSocialLoginMutation();
  const { phoneNumber, code, isLogin, token } = route.params;
  const { navigate, dispatch } = useNavigation<OnboardingStackNavigationProp>();
  const setUserTokens = useAppStore((state) => state.setUserTokens);

  const onRestoreAccount = async () => {
    try {
      toggleLoading(true);
      let response;
      if (isLogin) {
        response = await loginMutation({
          phoneNumber: phoneNumber || "",
          code: code || "",
          recover: true,
        });
      } else {
        response = await socialLoginMutation({
          token: token || "",
          recover: true,
        });
      }
      if (response?.OK) {
        setUserTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        registerNotificationToken();
        dispatch(StackActions.replace("AuthenticatedStack"));
      }
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onStartFresh = () => {
    navigate("Register");
  };
  return {
    onRestoreAccount,
    onStartFresh,
  };
};
