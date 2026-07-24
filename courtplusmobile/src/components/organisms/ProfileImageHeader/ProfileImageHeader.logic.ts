import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { useFollow, useUnfollow, useUploadImage } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useRef, useState } from "react";
import { Asset } from "react-native-image-picker";
import { useAppStore } from "store";
import { invalidateQuery, queryClient, queryKeys } from "utils";

export const useProfileImageHeader = (
  id: string,
  isCompleteProfile?: boolean
) => {
  const { mutateAsync: followMutation } = useFollow();
  const { mutateAsync: unfollowMutation } = useUnfollow();
  const toggleLoading = useAppStore((state) => state.toggleLoading);
  const { navigate, goBack } =
    useNavigation<AuthenticatedStackNavigationProp>();
  const imagePickerModalRef = useRef<BottomSheetModal>(null);
  const [pickerType, setPickerType] = useState("");
  const { mutateAsync: uploadImageMutation } = useUploadImage();

  const onFollow = async () => {
    try {
      toggleLoading(true);
      await followMutation({ id });
      queryClient.invalidateQueries({ queryKey: [queryKeys.getUsers] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.getUserById, id] });
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onUnfollow = async () => {
    try {
      toggleLoading(true);
      await unfollowMutation({ id });
      queryClient.invalidateQueries({ queryKey: [queryKeys.getUserById, id] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.getUsers] });
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onFollowersPress = (followers: boolean) => {
    navigate("ProfileStack", {
      screen: "Followers",
      params: { followers, userId: id },
    });
  };

  const onPickerPress = (type: "avatarAssetId" | "coverAssetId") => {
    setPickerType(type);
    imagePickerModalRef.current?.present();
  };

  const onImageSelected = async (image: Asset) => {
    try {
      toggleLoading(true);
      await uploadImageMutation({
        data: {
          uri: image.uri ?? "",
          fileName: image.fileName ?? "",
          fileSize: image.fileSize ?? 0,
          width: image.width ?? 0,
          height: image.height ?? 0,
          type: image.type ?? "",
        },
        type: pickerType === "avatarAssetId" ? "avatarAssetId" : "coverAssetId",
      });
      invalidateQuery("getProfile");
      !isCompleteProfile && goBack();
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const onClose = () => {
    imagePickerModalRef.current?.close();
  };

  return {
    onFollow,
    onUnfollow,
    navigate,
    onFollowersPress,
    imagePickerModalRef,
    onPickerPress,
    onImageSelected,
    onClose,
  };
};
