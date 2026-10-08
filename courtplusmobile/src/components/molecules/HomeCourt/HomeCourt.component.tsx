import { Card, Chip, CustomText, PressableScale } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, ImageBackground, View } from "react-native";
import { Images } from "theme";
import styles from "./HomeCourt.styles";
import { HomeCourtProps } from "./HomeCourt.types";
import { convertDistance, getCourtImage, mapSportGame } from "utils";
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
  const sport = item.sport ? mapSportGame(item.sport) : undefined;
  const hasPrice = item.hourlyRate !== undefined && item.hourlyRate !== null;
  const locationText = [
    item.branch?.name,
    item.distance !== undefined && item.distance !== null
      ? `${convertDistance(item.distance)} ${t("general.away")}`
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card overrideStyle={themedStyles.container} onPress={onPress}>
      <ImageBackground
        source={courtImage}
        style={themedStyles.image}
        imageStyle={themedStyles.imageRadius}
      >
        <View style={themedStyles.overlayRow}>
          <View style={themedStyles.ratingBadge}>
            <Image source={Images.star} style={themedStyles.ratingStar} />
            <CustomText
              font="caption"
              weight="semiBold"
              text={Number(item.avgRating ?? 0).toFixed(1)}
              overrideStyle={themedStyles.rating}
            />
          </View>
          <View style={themedStyles.trailingBadges}>
            {item.isAirConditioned && (
              <View
                style={themedStyles.featureBadge}
                accessible
                accessibilityLabel={t("court.airConditioned")}
              >
                <Image
                  source={Images.airConditioner}
                  style={themedStyles.featureIcon}
                />
              </View>
            )}
            {item.isWomenOnly && (
              <View
                style={themedStyles.featureBadge}
                accessible
                accessibilityLabel={t("court.womenOnly")}
              >
                <Image
                  source={Images.womenOnly}
                  style={themedStyles.featureIcon}
                />
              </View>
            )}
            <PressableScale
              style={themedStyles.bookmarkContainer}
              onPress={onBookmarkPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ selected: isBookmarked }}
            >
              <Image
                source={!isBookmarked ? Images.bookmark : Images.bookmark2}
                style={themedStyles.bookmarkIcon}
              />
            </PressableScale>
          </View>
        </View>
      </ImageBackground>
      <View style={themedStyles.body}>
        <CustomText
          font="cardTitle"
          weight="semiBold"
          text={item.name}
          numberOfLines={1}
          overrideStyle={themedStyles.name}
        />
        {!!locationText && (
          <View style={themedStyles.innerRowContainer}>
            <Image source={Images.location} style={themedStyles.locationIcon} />
            <CustomText
              text={locationText}
              font="caption"
              weight="regular"
              numberOfLines={1}
              overrideStyle={themedStyles.branchName}
            />
          </View>
        )}
        {(!!sport || hasPrice) && (
          <View style={themedStyles.footerRow}>
            {sport ? (
              <Chip
                title={sport.name}
                isSelected={false}
                variant="feature"
                size="small"
              />
            ) : (
              <View />
            )}
            {hasPrice && (
              <View style={themedStyles.priceRow}>
                <CustomText
                  font="headline3"
                  weight="bold"
                  text={`${item.hourlyRate}`}
                  overrideStyle={themedStyles.price}
                />
                <CustomText
                  font="caption"
                  weight="medium"
                  text={`${item.currency ?? t("general.currency")} ${t(
                    "general.perHour",
                    { defaultValue: "/ hr" }
                  )}`}
                  overrideStyle={themedStyles.priceUnit}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </Card>
  );
};

export default HomeCourt;
