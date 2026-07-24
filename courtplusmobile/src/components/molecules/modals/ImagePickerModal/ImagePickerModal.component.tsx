import React, { forwardRef } from "react";
import { ImagePickerModalProps } from "./ImagePickerModal.types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import { CustomButton } from "atoms/index";
import { View } from "react-native";
import { useImagePickerModal } from "./ImagePickerModal.logic";
import { useTranslation } from "react-i18next";
import styles from "./ImagePickerModal.styles";

const ImagePickerModal = forwardRef<BottomSheetModal, ImagePickerModalProps>(
  ({ onClose, onImageSelected }, ref) => {
    const { onCameraPress, onGalleryPress } = useImagePickerModal({
      onClose,
      onImageSelected,
    });
    const { t } = useTranslation();
    return (
      <BottomSheetOverlay isWhite ref={ref}>
        <View style={styles.container}>
          <CustomButton title={t("general.camera")} onPress={onCameraPress} />
          <CustomButton title={t("general.gallery")} onPress={onGalleryPress} />
        </View>
      </BottomSheetOverlay>
    );
  }
);

export default ImagePickerModal;
