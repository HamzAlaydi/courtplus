import { BottomSheetModal, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { CustomButton, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import React, { forwardRef, useMemo } from "react";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./ReviewCourtModal.styles";
import { useTranslation } from "react-i18next";
import { useReviewCourtModal } from "./ReviewCourtModal.logic";
import StarDisplay from "molecules/StarDisplay/StarDisplay.component";
import { ReviewCourtModalProps } from "./ReviewCourtModal.types";

const ReviewCourtModal = forwardRef<BottomSheetModal, ReviewCourtModalProps>(
  ({ courtName, bookingId, onClose, onLater, title }, ref) => {
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(() => styles(colors), [colors]);
    const { t } = useTranslation();
    const {
      comment,
      rating,
      onDismiss,
      setComment,
      setRating,
      isButtonDisabled,
      onAddReviewPress,
    } = useReviewCourtModal(bookingId, onClose);
    return (
      <BottomSheetOverlay onDismiss={onDismiss} isWhite ref={ref}>
        <View style={themedStyles.content}>
          <CustomText
            text={title ?? t("reviews.title")}
            font="screenTitle"
            weight="extraBold"
            accessibilityRole="header"
            overrideStyle={themedStyles.title}
          />
          <CustomText
            font="headline3"
            weight="medium"
            text={courtName}
            numberOfLines={1}
            overrideStyle={themedStyles.court}
          />
        </View>
        <CustomText
          text={t("reviews.description")}
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.hint}
        />
        <View style={themedStyles.starContainer}>
          <StarDisplay
            rating={rating}
            onChange={setRating}
            overrideImageStyle={themedStyles.starImage}
          />
        </View>

        <BottomSheetTextInput
          placeholder={t("reviews.addComment")}
          placeholderTextColor={colors.MUTED}
          selectionColor={colors.INK}
          value={comment}
          onChangeText={setComment}
          multiline
          textAlignVertical="top"
          style={themedStyles.inputContainer}
        />
        <CustomButton
          title={t("reviews.addReview")}
          leftIcon={
            <Image
              source={Images.review}
              style={[
                themedStyles.buttonIcon,
                isButtonDisabled && themedStyles.buttonIconDisabled,
              ]}
            />
          }
          onPress={onAddReviewPress}
          overrideStyle={themedStyles.button}
          disabled={isButtonDisabled}
          variant={isButtonDisabled ? "disabledDark" : "primary"}
        />
        {onLater && (
          <CustomButton
            variant="link"
            title={t("reviews.later")}
            onPress={onLater}
            overrideStyle={themedStyles.laterButton}
          />
        )}
      </BottomSheetOverlay>
    );
  }
);

export default ReviewCourtModal;
