import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { ReviewItemProps } from "./ReviewItem.types";
import { formatTime, generateFullName } from "utils";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./ReviewItem.styles";
import { Images } from "theme";

const STARS = [1, 2, 3, 4, 5];

const ReviewItem = ({ item, overrideStyle }: ReviewItemProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const formattedDays = formatTime(item.createdAt);
  const rating = Math.round(item.rating ?? 0);

  const currentImage = item.user.avatarUrl
    ? { uri: item.user.avatarUrl }
    : Images.maleProfile;

  return (
    <View style={[themedStyles.card, overrideStyle]}>
      <View style={themedStyles.header}>
        <Image source={currentImage} style={themedStyles.image} />
        <View style={themedStyles.userInfo}>
          <CustomText
            font="cardTitle"
            weight="semiBold"
            numberOfLines={1}
            text={generateFullName(item.user)}
          />
          {!!item.user.username && (
            <CustomText
              font="caption"
              weight="regular"
              numberOfLines={1}
              text={`@${item.user.username}`}
              overrideStyle={themedStyles.username}
            />
          )}
        </View>
        <CustomText
          text={formattedDays}
          font="caption"
          weight="regular"
          numberOfLines={1}
          overrideStyle={themedStyles.date}
        />
      </View>
      <View
        style={themedStyles.starsRow}
        accessible
        accessibilityLabel={`${item.rating}/5`}
      >
        {STARS.map((star) => (
          <Image
            key={star}
            source={Images.star}
            style={[themedStyles.star, star > rating && themedStyles.emptyStar]}
          />
        ))}
      </View>
      {!!item.comment && (
        <CustomText
          text={item.comment}
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.comment}
        />
      )}
    </View>
  );
};

export default ReviewItem;
