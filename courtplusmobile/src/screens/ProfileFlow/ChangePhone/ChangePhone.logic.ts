import { useForm } from "react-hook-form";
import { ChangePhoneFields, changePhoneSchema } from "./ChangePhone.types";
import { yupResolver } from "@hookform/resolvers/yup";
import { useGetProfile, useUpdatePhone } from "apis";
import { excludeCountryCode, includeCountryCode } from "utils";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useAppStore } from "store";
import { ProfileStackNavigationProp } from "navigation/types";
import { useNavigation } from "@react-navigation/native";

export const useChangePhone = () => {
  const { data, isFetching } = useGetProfile();
  const methods = useForm<ChangePhoneFields>({
    mode: "onBlur",
    resolver: yupResolver(changePhoneSchema),
    defaultValues: {
      phoneNumber: excludeCountryCode(data?.phoneNumber ?? ""),
    },
  });
  const toggleLoading = useAppStore((store) => store.toggleLoading);
  const { navigate } = useNavigation<ProfileStackNavigationProp>();

  const { mutateAsync: updatePhoneMutation, isPending: isUpdatingPhone } =
    useUpdatePhone();

  const selectedCountryCode = useAppStore((state) => state.selectedCountryCode);

  const onSubmit = async (data: ChangePhoneFields) => {
    const phoneNumber = `${selectedCountryCode}${data.phoneNumber}`;
    try {
      toggleLoading(true);
      await updatePhoneMutation({
        phoneNumber,
      });
      toggleLoading(false);
      navigate("VerifyPhone", { phoneNumber });
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };
  const isDisabled = !methods.formState.isDirty || !methods.formState.isValid;

  return {
    methods,
    onSubmit,
    isDisabled,
    phoneNumber: data?.phoneNumber,
    isLoading: isFetching,
  };
};
