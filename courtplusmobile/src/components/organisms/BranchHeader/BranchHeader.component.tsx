import React, { useMemo } from "react";
import { Image, ImageBackground, View } from "react-native";
import { BranchHeaderProps } from "./BranchHeader.types";
import { useThemeContext } from "contexts";
import styles from "./BranchHeader.styles";
import { BackButton, IconButton, PressableScale } from "atoms/index";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useBranchHeader } from "./BranchHeader.logic";
import { verticalScale } from "utils";

const BranchHeader = ({
  coverUrl,
  imageUrl,
  isBookmarked,
  branchId,
}: BranchHeaderProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { top } = useSafeAreaInsets();
  const { t } = useTranslation();
  const { onBookmarkPress } = useBranchHeader({ id: branchId, isBookmarked });

  return (
    <View>
      <ImageBackground
        source={coverUrl ? { uri: coverUrl } : undefined}
        style={themedStyles.image}
      >
        <View
          style={[
            themedStyles.container,
            { paddingTop: top + verticalScale(8) },
          ]}
        >
          <BackButton
            whiteColor
            overrideStyle={themedStyles.icon}
            iconStyle={themedStyles.backIcon}
          />
          <PressableScale
            style={themedStyles.icon}
            accessibilityRole="button"
            hitSlop={6}
          >
            <Image source={Images.dot} style={themedStyles.dotIcon} />
          </PressableScale>
        </View>
      </ImageBackground>
      <View style={themedStyles.sheetTop}>
        <View style={themedStyles.logoRing}>
          <Image
            source={imageUrl ? { uri: imageUrl } : Images.court}
            style={imageUrl ? themedStyles.logo : themedStyles.logoFallback}
          />
        </View>
        <IconButton
          icon={isBookmarked ? Images.heartFilled : Images.heart}
          title={
            isBookmarked ? t("branchDetails.liked") : t("branchDetails.like")
          }
          onPress={onBookmarkPress}
          overrideStyle={[
            themedStyles.button,
            isBookmarked && themedStyles.likedButton,
          ]}
          overrideIconStyle={[
            themedStyles.likeIcon,
            isBookmarked && themedStyles.likedIcon,
          ]}
        />
      </View>
    </View>
  );
};

export default BranchHeader;
