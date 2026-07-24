import { yupResolver } from "@hookform/resolvers/yup";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { ProfileStackParamList } from "navigation/types";
import { useForm } from "react-hook-form";
import {
  formatDate,
  generateFullName,
  invalidateQuery,
  mapGenderTitle,
  mapGenderValue,
} from "utils";
import { UpdateProfileFields, updateProfileSchema } from "./UpdateProfile.data";
import { useAppStore } from "store";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useCheckUsernameMutation, useEditProfile } from "apis";
import { useTranslation } from "react-i18next";

export const useUpdateProfile = () => {
  const { params } =
    useRoute<RouteProp<ProfileStackParamList, "UpdateProfile">>();
  const { user } = params;
  const methods = useForm({
    mode: "onBlur",
    resolver: yupResolver(updateProfileSchema) as any,
    defaultValues: {
      fullName: generateFullName(user!!),
      username: user?.username || "",
      dateOfBirth: formatDate(user?.dateOfBirth || "", "dd/MM/yyyy"),
      bio: user?.bio,
      gender: mapGenderValue(user?.gender)?.title ?? "",
    },
  });
  const toggleLoading = useAppStore((store) => store.toggleLoading);
  const { mutateAsync: editProfileMutation } = useEditProfile();
  const { checkUsernameMutation } = useCheckUsernameMutation();
  const { t } = useTranslation();
  const { goBack } = useNavigation();

  const onSubmit = async (data: UpdateProfileFields) => {
    try {
      toggleLoading(true);
      const response = await checkUsernameMutation({ username: data.username });
      if (response?.OK && response?.available) {
        await editProfileMutation({
          user: {
            firstName: data.fullName.split(" ")[0],
            lastName: data.fullName.split(" ")[1],
            username: data.username,
            dateOfBirth: data.dateOfBirth,
            bio: data.bio,
            gender: mapGenderTitle(data.gender)?.value ?? "",
          },
        });
        invalidateQuery("getProfile");
        goBack();
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

  const isValid = methods.formState.isValid && methods.formState.isDirty;

  return {
    user,
    methods,
    isValid,
    onSubmit,
  };
};
