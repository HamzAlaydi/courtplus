import {
  RouteProp,
  StackActions,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import {
  useLoginMutation,
  useSendCodeMutation,
  useSignupMutation,
  registerNotificationToken,
} from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import {
  OnboardingStackNavigationProp,
  OnboardingStackParamList,
} from "navigation/types";
import { useTranslation } from "react-i18next";
import { useAppStore } from "store";
import { mapGenderTitle } from "utils";

export const useOTPVerification = () => {
  const route =
    useRoute<RouteProp<OnboardingStackParamList, "OTPVerification">>();
  const { phoneNumber, isLogin, signUpData } = route.params;
  const { loginMutation } = useLoginMutation();
  const { navigate, dispatch } = useNavigation<OnboardingStackNavigationProp>();
  const toggleLoading = useAppStore((state) => state.toggleLoading);
  const setUserTokens = useAppStore((state) => state.setUserTokens);
  const { t } = useTranslation();
  const { sendCodeMutation } = useSendCodeMutation();
  const { signupMutation } = useSignupMutation();

  const onSendCode = async () => {
    try {
      toggleLoading(true);
      await sendCodeMutation({ phoneNumber, purpose: isLogin ? "login" : "signup" });
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onFilled = async (otp: string) => {
    try {
      toggleLoading(true);
      let response;
      if (isLogin) {
        response = await loginMutation({ phoneNumber, code: otp });
      } else {
        response = await signupMutation({
          phoneNumber,
          code: otp,
          firstName: signUpData?.fullName.split(" ")[0] || "",
          lastName: signUpData?.fullName.split(" ")[1] || "",
          username: signUpData?.username || "",
          dateOfBirth: signUpData?.dateOfBirth?.split("/").reverse().join("-"),
          gender: mapGenderTitle(signUpData?.gender ?? "")?.value || "",
        });
      }
      if (response?.accessToken) {
        setUserTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        registerNotificationToken();
        if (isLogin) {
          dispatch(StackActions.replace("AuthenticatedStack"));
        } else {
          dispatch(StackActions.replace("CompleteProfile"));
        }
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === t("messages.ACCOUNT_DELETED")) {
        navigate("RecoverAccount", {
          phoneNumber,
          code: otp,
          isLogin,
        });
      } else {
        showSnackbar({
          message: (error as Error).message,
        });
      }
    } finally {
      toggleLoading(false);
    }
  };

  const onLoginPress = () => {
    navigate("Login");
  };

  const onSignUpPress = () => {
    navigate("Register");
  };

  const footerText = isLogin ? t("auth.noAccount") : t("auth.haveAccount");
  const footerText2 = isLogin ? t("auth.signUp") : t("auth.signIn");
  const onFooterPress = isLogin ? onSignUpPress : onLoginPress;

  return {
    footerText,
    footerText2,
    onFilled,
    onLoginPress,
    phoneNumber,
    onSignUpPress,
    onFooterPress,
    onSendCode,
  };
};
