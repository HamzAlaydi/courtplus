import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import {
  ErrorCode,
  launchCamera,
  launchImageLibrary,
} from "react-native-image-picker";
import { onPhotoError } from "utils";
import { ImagePickerModalProps } from "./ImagePickerModal.types";

export const useImagePickerModal = ({
  onClose,
  onImageSelected,
}: ImagePickerModalProps) => {
  const onCameraPress = async () => {
    try {
      onClose();
      const result = await launchCamera({
        mediaType: "photo",
        includeBase64: true,
        includeExtra: true,
      });

      if (result?.assets?.[0]) {
        return onImageSelected(result.assets[0]);
      }
      return null;
    } catch (error) {
      const errorMessage = onPhotoError(error as ErrorCode);
      showSnackbar({ message: errorMessage });
    }
  };

  const onGalleryPress = async () => {
    try {
      onClose();
      const result = await launchImageLibrary({
        mediaType: "photo",
        includeExtra: true,
      });
      if (result?.assets?.[0]) {
        return onImageSelected(result.assets[0]);
      }
    } catch (error) {
      const errorMessage = onPhotoError(error as ErrorCode);
      showSnackbar({ message: errorMessage });
    }
  };

  return {
    onCameraPress,
    onGalleryPress,
  };
};
