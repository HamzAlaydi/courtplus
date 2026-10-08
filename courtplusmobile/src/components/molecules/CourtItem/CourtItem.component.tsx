import {
  Card,
  Chip,
  CustomButton,
  CustomText,
  PressableScale,
} from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, ImageBackground, View } from "react-native";
import { Images } from "theme";
import styles from "./CourtItem.styles";
import { CourtItemProps } from "./CourtItem.types";
import { convertDistance, getCourtImage, mapSportGame } from "utils";
import { useTranslation } from "react-i18next";
import { useToggleBookmark } from "hooks";

const CourtItem = ({
  onPress,
  overrideStyle,
  item,
  showBottomInfo = true,
  ctaTitle,
}: CourtItemProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { isBookmarked, onBookmarkPress } = useToggleBookmark(item);

  const courtImage = getCourtImage(item);
  const sport = item.sport ? mapSportGame(item.sport) : undefined;
  const hasFeatures = !!item.isAirConditioned || !!item.isWomenOnly;
  const hasPrice = item.hourlyRate !== undefined && item.hourlyRate !== null;
  const locationText = [
    item?.branch?.name,
    item.distance !== undefined && item.distance !== null
      ? `${convertDistance(item.distance)} ${t("general.away")}`
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

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
        {hasFeatures && (
          <View style={themedStyles.featureRow}>
            {item.isAirConditioned && (
              <View style={themedStyles.featurePill}>
                <Image
                  source={Images.airConditioner}
                  style={themedStyles.featureIcon}
                />
                <CustomText
                  font="caption"
                  weight="semiBold"
                  text={t("court.airConditioned")}
                  overrideStyle={themedStyles.featureText}
                />
              </View>
            )}
            {item.isWomenOnly && (
              <View style={themedStyles.featurePill}>
                <Image
                  source={Images.womenOnly}
                  style={themedStyles.featureIcon}
                />
                <CustomText
                  font="caption"
                  weight="semiBold"
                  text={t("court.womenOnly")}
                  overrideStyle={themedStyles.featureText}
                />
              </View>
            )}
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
      </ImageBackground>

      <View style={themedStyles.body}>
        <View style={themedStyles.titleRow}>
          <View style={themedStyles.titleColumn}>
            <CustomText
              font="cardTitle"
              weight="bold"
              text={item.name}
              numberOfLines={1}
              overrideStyle={themedStyles.brancName}
            />
            {showBottomInfo && !!locationText && (
              <View style={themedStyles.rowContainer}>
                <Image
                  source={Images.location}
                  style={themedStyles.locationIcon}
                />
                <CustomText
                  font="caption"
                  weight="regular"
                  text={locationText}
                  numberOfLines={1}
                  overrideStyle={themedStyles.location}
                />
              </View>
            )}
          </View>
          <View style={themedStyles.ratingRow}>
            <Image source={Images.star} style={themedStyles.starIcon} />
            <CustomText
              font="headline3"
              weight="bold"
              text={Number(item.avgRating ?? 0).toFixed(1)}
              overrideStyle={themedStyles.rating}
            />
            {item.reviewsCount !== undefined && item.reviewsCount !== null && (
              <CustomText
                font="caption"
                weight="regular"
                text={`(${item.reviewsCount})`}
                overrideStyle={themedStyles.reviewsCount}
              />
            )}
          </View>
        </View>

        {!!sport && (
          <View style={themedStyles.chipsRow}>
            <Chip
              title={sport.name}
              isSelected={false}
              variant="feature"
              size="small"
            />
          </View>
        )}

        <View style={themedStyles.footer}>
          <View style={themedStyles.priceRow}>
            {hasPrice && (
              <>
                <CustomText
                  font="displayNumber"
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
              </>
            )}
          </View>
          {ctaTitle ? (
            <CustomButton
              title={ctaTitle}
              onPress={onPress}
              variant="primary"
              size="small"
              overrideStyle={themedStyles.ctaButton}
            />
          ) : (
            <PressableScale
              style={themedStyles.arrowButton}
              onPress={onPress}
              accessibilityRole="button"
            >
              <Image source={Images.arrowLeft} style={themedStyles.arrowIcon} />
            </PressableScale>
          )}
        </View>
      </View>
    </Card>
  );
};

export default CourtItem;
