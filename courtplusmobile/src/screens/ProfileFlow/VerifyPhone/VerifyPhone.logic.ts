import {
  RouteProp,
  StackActions,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useUpdatePhone, useVerifyUserPhone } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { ProfileStackParamList } from "navigation/types";
import { useAppStore } from "store";
import { invalidateQuery } from "utils";

export const useVerifyPhone = () => {
  const route = useRoute<RouteProp<ProfileStackParamList, "VerifyPhone">>();
  const { dispatch } = useNavigation();
  const { mutateAsync: verifyPhoneMutation, isPending: isVerifyingPhone } =
    useVerifyUserPhone();
  const toggleLoading = useAppStore((state) => state.toggleLoading);
  const { mutateAsync: updatePhoneMutation, isPending: isUpdatingPhone } =
    useUpdatePhone();

  const { phoneNumber } = route.params;

  const onFilled = async (code: string) => {
    try {
      toggleLoading(true);
      await verifyPhoneMutation({ phoneNumber, code });
      invalidateQuery("getProfile");
      toggleLoading(false);
      dispatch(StackActions.popToTop());
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onResendCode = async () => {
    try {
      toggleLoading(true);
      await updatePhoneMutation({ phoneNumber });
      toggleLoading(false);
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };
  return {
    onFilled,
    onResendCode,
  };
};
