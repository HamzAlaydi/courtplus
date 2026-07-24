import { isAndroid } from "utils";
import {
  getAuth,
  getIdToken,
  GoogleAuthProvider,
  signInWithCredential,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useSocialLoginMutation } from "apis";
import { StackActions, useNavigation } from "@react-navigation/native";
import { useAppStore } from "store";
import { useTranslation } from "react-i18next";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { OnboardingStackNavigationProp } from "navigation/types";

export const useSocial = (isLoginScreen: boolean) => {
  const { dispatch, navigate } = useNavigation<OnboardingStackNavigationProp>();
  const { t } = useTranslation();
  const { mutateAsync: socialLoginMutation } = useSocialLoginMutation();
  const toggleLoading = useAppStore((state) => state.toggleLoading);
  const setUserTokens = useAppStore((state) => state.setUserTokens);

  const onCompleteSocialLogin = () => {
    if (isLoginScreen) {
      dispatch(StackActions.replace("AuthenticatedStack"));
    } else {
      dispatch(StackActions.replace("CompleteProfile"));
    }
  };
  const onAppleLogin = () => {};

  const onGoogleLogin = async () => {
    if (isAndroid) {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }
    let idToken = "";
    try {
      const response = await GoogleSignin.signIn();
      if (response.data) {
        toggleLoading(true);
        const authInstance = getAuth();
        const googleCredential = GoogleAuthProvider.credential(
          response.data.idToken
        );
        const user = await signInWithCredential(authInstance, googleCredential);
        idToken = await getIdToken(user.user);
        const socialResponse = await socialLoginMutation({ token: idToken });
        if (socialResponse) {
          onCompleteSocialLogin();
          setUserTokens({
            accessToken: socialResponse.accessToken,
            refreshToken: socialResponse.refreshToken,
          });
        }
      } else {
        showSnackbar({
          message: t("general.error"),
        });
      }
    } catch (e) {
      const errorMessage = (e as Error).message;
      if (errorMessage === t("messages.ACCOUNT_DELETED")) {
        navigate("RecoverAccount", {
          token: idToken,
          isLogin: false,
        });
        return;
      }
      showSnackbar({
        message: (e as Error).message,
      });
    } finally {
      toggleLoading(false);
    }
  };

  return {
    onGoogleLogin,
    onAppleLogin,
  };
};
