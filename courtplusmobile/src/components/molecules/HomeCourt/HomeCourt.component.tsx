import { Card, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, ImageBackground, TouchableOpacity, View } from "react-native";
import { Images } from "theme";
import styles from "./HomeCourt.styles";
import { HomeCourtProps } from "./HomeCourt.types";
import { convertDistance, getCourtImage } from "utils";
import { useTranslation } from "react-i18next";
import { useToggleBookmark } from "hooks";

const HomeCourt = ({ item, onPress }: HomeCourtProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { isBookmarked, onBookmarkPress } = useToggleBookmark(item);

  const courtImage = getCourtImage(item);

  return (
    <Card overrideStyle={themedStyles.container} onPress={onPress}>
      <ImageBackground
        source={courtImage}
        style={themedStyles.image}
        imageStyle={themedStyles.image}
      >
        <TouchableOpacity
          style={themedStyles.bookmarkContainer}
          onPress={onBookmarkPress}
          hitSlop={8}
        >
          <Image
            source={!isBookmarked ? Images.bookmark : Images.bookmark2}
            style={!isBookmarked && themedStyles.bookmarkIcon}
          />
        </TouchableOpacity>
      </ImageBackground>
      <CustomText
        font="headline3"
        weight="bold"
        text={item.name}
        overrideStyle={themedStyles.name}
      />
      <View style={themedStyles.rowContainer}>
        <View style={themedStyles.innerRowContainer}>
          <Image source={Images.location} />
          <CustomText
            text={item.branch.name}
            font="text"
            weight="medium"
            numberOfLines={1}
            overrideStyle={themedStyles.branchName}
          />
        </View>
        <View style={themedStyles.innerRowContainer}>
          <Image source={Images.star} />
          <CustomText
            font="text"
            weight="semiBold"
            text={Number(item.avgRating ?? 0).toFixed(1)}
            overrideStyle={themedStyles.rating}
          />
        </View>
      </View>
      <View style={themedStyles.distanceContainer}>
        <Image source={Images.discovery} />
        <CustomText
          font="text"
          weight="regular"
          text={`${convertDistance(item.distance)} ${t("general.away")}`}
          overrideStyle={themedStyles.distance}
        />
      </View>
    </Card>
  );
};

export default HomeCourt;
