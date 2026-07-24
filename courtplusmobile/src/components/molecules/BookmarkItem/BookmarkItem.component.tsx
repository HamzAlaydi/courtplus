import React, { useMemo } from "react";
import { Image, ImageBackground, TouchableOpacity, View } from "react-native";
import { BookmarkItemProps } from "./BookmarkItem.types";
import { CustomText } from "atoms/index";
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
    <TouchableOpacity
      style={[themedStyles.container, overrideStyle]}
      onPress={onPress}
    >
      <ImageBackground
        style={themedStyles.imageBg}
        imageStyle={themedStyles.image}
        source={image}
      >
        <TouchableOpacity
          onPress={onBookmarkPress}
          style={themedStyles.bookmarkContainer}
        >
          <Image source={Images.bookmark2} style={themedStyles.bookmarkIcon} />
        </TouchableOpacity>
      </ImageBackground>
      <View style={themedStyles.content}>
        <CustomText font="headline2" weight="bold" text={title} />
        <View style={themedStyles.locationContainer}>
          <Image source={Images.location} />
          <CustomText
            font="chip"
            weight="medium"
            text={locationName}
            overrideStyle={themedStyles.locationName}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default BookmarkItem;
