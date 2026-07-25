import { Card, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, ImageBackground, TouchableOpacity, View } from "react-native";
import { Images } from "theme";
import styles from "./CourtItem.styles";
import { CourtItemProps } from "./CourtItem.types";
import { convertDistance, getCourtImage } from "utils";
import { useTranslation } from "react-i18next";
import { useToggleBookmark } from "hooks";

const CourtItem = ({
  onPress,
  overrideStyle,
  item,
  showBottomInfo = true,
}: CourtItemProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { isBookmarked, onBookmarkPress } = useToggleBookmark(item);

  const courtImage = getCourtImage(item);

  return (
    <Card
      overrideStyle={[themedStyles.courtCard, overrideStyle]}
      onPress={onPress}
    >
      <ImageBackground
        source={courtImage}
        style={themedStyles.imageBg}
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
      <View style={themedStyles.branchContainer}>
        <CustomText
          font="headline2"
          weight="bold"
          text={item.name}
          overrideStyle={themedStyles.brancName}
        />
        <View style={themedStyles.rowContainer}>
          <Image source={Images.star} />
          <CustomText
            font="headline3"
            weight="semiBold"
            text={`${item.avgRating}`}
            overrideStyle={themedStyles.rating}
          />
        </View>
      </View>
      {showBottomInfo && (
        <View style={themedStyles.locationContainer}>
          <View style={themedStyles.rowContainer}>
            <Image source={Images.location} />
            <CustomText
              font="chip"
              weight="medium"
              text={item?.branch?.name}
              overrideStyle={themedStyles.location}
            />
          </View>
          <View style={themedStyles.rowContainer}>
            <Image source={Images.discovery} />
            <CustomText
              font="chip"
              weight="regular"
              text={`${convertDistance(item.distance)} ${t("general.away")}`}
              overrideStyle={themedStyles.distance}
            />
          </View>
        </View>
      )}
    </Card>
  );
};

export default CourtItem;
