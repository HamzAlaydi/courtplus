import { StackActions, useNavigation } from "@react-navigation/native";
import { useEditProfile, useGetProfile } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useState } from "react";
import { useAppStore } from "store";
import { invalidateQuery } from "utils";

export const useCompleteProfile = () => {
  const { data, isFetching } = useGetProfile();
  const { dispatch } = useNavigation();
  const [bio, setBio] = useState("");
  const { mutateAsync: editProfileMutation } = useEditProfile();
  const toggleLoading = useAppStore((store) => store.toggleLoading);

  const onDone = async () => {
    try {
      toggleLoading(true);
      if (bio) {
        await editProfileMutation({
          user: {
            bio: bio,
          },
        });
        invalidateQuery("getProfile");
        dispatch(StackActions.replace("AuthenticatedStack"));
      } else {
        dispatch(StackActions.replace("AuthenticatedStack"));
      }
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };
  const onSkipPress = () => {
    dispatch(StackActions.replace("AuthenticatedStack"));
  };

  const onBioChange = (text: string) => {
    setBio(text);
  };
  return {
    data,
    isFetching,
    onSkipPress,
    onBioChange,
    bio,
    onDone,
  };
};
