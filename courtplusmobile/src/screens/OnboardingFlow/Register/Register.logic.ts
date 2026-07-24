import { yupResolver } from "@hookform/resolvers/yup";
import { useCheckUsernameMutation, useSendCodeMutation } from "apis";
import { RegisterFields, registerSchema } from "./Register.data";
import { useForm } from "react-hook-form";
import { useAppStore } from "store";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { OnboardingStackNavigationProp } from "navigation/types";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

export const useRegister = () => {
  const methods = useForm<RegisterFields>({
    mode: "onBlur",
    resolver: yupResolver(registerSchema),
    defaultValues: {
      dateOfBirth: "",
      gender: "",
      fullName: "",
      username: "",
      phoneNumber: "",
    },
  });
  const { checkUsernameMutation } = useCheckUsernameMutation();
  const toggleLoading = useAppStore((state) => state.toggleLoading);
  const { navigate, goBack } = useNavigation<OnboardingStackNavigationProp>();
  const selectedCountryCode = useAppStore((state) => state.selectedCountryCode);
  const { t } = useTranslation();
  const { sendCodeMutation } = useSendCodeMutation();

  const onSubmit = async (data: RegisterFields) => {
    try {
      toggleLoading(true);
      const response = await checkUsernameMutation({ username: data.username });
      if (response?.OK && response?.available) {
        await sendCodeMutation({
          phoneNumber: `${selectedCountryCode}${data.phoneNumber}`,
          purpose: "signup",
        });
        navigate("OTPVerification", {
          phoneNumber: `${selectedCountryCode}${data.phoneNumber}`,
          isLogin: false,
          signUpData: data,
        });
      } else {
        showSnackbar({
          message: `${t("form.suggestions")}: ${response?.suggestions?.join(
            ", "
          )}`,
        });
      }
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const errors = methods.formState.errors;

  return {
    methods,
    onSubmit,
    errors,
    goBack,
  };
};
