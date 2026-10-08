import React, { useMemo } from "react";
import { Image, ImageBackground, View } from "react-native";
import { BookmarkItemProps } from "./BookmarkItem.types";
import { Card, CustomText, PressableScale } from "atoms/index";
import { Images } from "theme";
import { useThemeContext } from "contexts";
import styles from "./BookmarkItem.styles";

const BookmarkItem = ({
  image,
  title,
  locationName,
  onPress,
  overrideStyle,
  onBookmarkPress,
}: BookmarkItemProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  return (
    <Card
      overrideStyle={[themedStyles.container, overrideStyle]}
      onPress={onPress}
    >
      <ImageBackground
        style={themedStyles.imageBg}
        imageStyle={themedStyles.image}
        source={image}
      >
        <PressableScale
          onPress={onBookmarkPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ selected: true }}
          style={themedStyles.bookmarkContainer}
        >
          <Image source={Images.bookmark2} style={themedStyles.bookmarkIcon} />
        </PressableScale>
      </ImageBackground>
      <View style={themedStyles.content}>
        <View style={themedStyles.textContainer}>
          <CustomText
            font="cardTitle"
            weight="bold"
            text={title}
            numberOfLines={1}
          />
          {!!locationName && (
            <View style={themedStyles.locationContainer}>
              <Image
                source={Images.location}
                style={themedStyles.locationIcon}
              />
              <CustomText
                font="caption"
                weight="regular"
                text={locationName}
                numberOfLines={1}
                overrideStyle={themedStyles.locationName}
              />
            </View>
          )}
        </View>
        <View style={themedStyles.arrowButton}>
          <Image source={Images.arrowLeft} style={themedStyles.arrowIcon} />
        </View>
      </View>
    </Card>
  );
};

export default BookmarkItem;
