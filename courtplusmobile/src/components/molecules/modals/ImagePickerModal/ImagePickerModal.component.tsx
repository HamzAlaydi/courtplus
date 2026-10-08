import React, { forwardRef, useMemo } from "react";
import { ImagePickerModalProps } from "./ImagePickerModal.types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import { CustomText, PressableScale } from "atoms/index";
import { Image, ImageSourcePropType, View } from "react-native";
import { useImagePickerModal } from "./ImagePickerModal.logic";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import { Images } from "theme";
import styles from "./ImagePickerModal.styles";

const ImagePickerModal = forwardRef<BottomSheetModal, ImagePickerModalProps>(
  ({ onClose, onImageSelected }, ref) => {
    const { onCameraPress, onGalleryPress } = useImagePickerModal({
      onClose,
      onImageSelected,
    });
    const { t } = useTranslation();
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(() => styles(colors), [colors]);

    const renderOption = (
      title: string,
      icon: ImageSourcePropType,
      onPress: () => void
    ) => (
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={themedStyles.option}
      >
        <View style={themedStyles.iconCircle}>
          <Image source={icon} style={themedStyles.icon} />
        </View>
        <CustomText
          text={title}
          font="cardTitle"
          weight="semiBold"
          numberOfLines={1}
          overrideStyle={themedStyles.label}
        />
      </PressableScale>
    );

    return (
      <BottomSheetOverlay isWhite ref={ref}>
        <View style={themedStyles.container}>
          {renderOption(t("general.camera"), Images.photo, onCameraPress)}
          {renderOption(t("general.gallery"), Images.capture, onGalleryPress)}
        </View>
      </BottomSheetOverlay>
    );
  }
);

export default ImagePickerModal;
