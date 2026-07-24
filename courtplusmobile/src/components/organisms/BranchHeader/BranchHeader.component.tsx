import React, { useMemo } from "react";
import { Image, ImageBackground, TouchableOpacity, View } from "react-native";
import { BranchHeaderProps } from "./BranchHeader.types";
import { useThemeContext } from "contexts";
import styles from "./BranchHeader.styles";
import { BackButton, IconButton } from "atoms/index";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useBranchHeader } from "./BranchHeader.logic";

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
      <ImageBackground source={{ uri: coverUrl }} style={themedStyles.image}>
        <View style={[themedStyles.container, { paddingTop: top }]}>
          <BackButton
            overrideStyle={themedStyles.icon}
            iconStyle={themedStyles.backIcon}
          />
          <TouchableOpacity style={themedStyles.icon}>
            <Image source={Images.dot} />
          </TouchableOpacity>
        </View>
        <View style={themedStyles.infoContainer}>
          <Image source={{ uri: imageUrl }} style={themedStyles.logo} />
          <IconButton
            icon={isBookmarked ? Images.heartFilled : Images.heart}
            title={
              isBookmarked ? t("branchDetails.liked") : t("branchDetails.like")
            }
            onPress={onBookmarkPress}
            overrideStyle={themedStyles.button}
          />
        </View>
      </ImageBackground>
    </View>
  );
};

export default BranchHeader;
