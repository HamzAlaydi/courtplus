import { useNavigation } from "@react-navigation/native";
import { OnboardingStackNavigationProp } from "navigation/types";
import { LoginFields, loginSchema } from "./Login.data";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useSendCodeMutation } from "apis";
import { useAppStore } from "store";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";

export const useLogin = () => {
  const toggleLoading = useAppStore((state) => state.toggleLoading);
  const { navigate } = useNavigation<OnboardingStackNavigationProp>();
  const methods = useForm<LoginFields>({
    mode: "onBlur",
    resolver: yupResolver(loginSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });
  const selectedCountryCode = useAppStore((state) => state.selectedCountryCode);
  const { sendCodeMutation } = useSendCodeMutation();

  const onLoginPress = async (data: LoginFields) => {
    try {
      toggleLoading(true);
      const response = await sendCodeMutation({
        phoneNumber: `${selectedCountryCode}${data.phoneNumber}`,
        purpose: "login",
      });
      if (response) {
        navigate("OTPVerification", {
          phoneNumber: `${selectedCountryCode}${data.phoneNumber}`,
          isLogin: true,
        });
      }
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onSignUpPress = () => {
    navigate("Register");
  };
  return {
    onLoginPress,
    onSignUpPress,
    methods,
  };
};
