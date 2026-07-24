import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { ReviewItemProps } from "./ReviewItem.types";
import { formatTime, generateFullName } from "utils";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./ReviewItem.styles";
import StarDisplay from "molecules/StarDisplay/StarDisplay.component";
import { Images } from "theme";

const ReviewItem = ({ item }: ReviewItemProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const formattedDays = formatTime(item.createdAt);

  const currentImage = item.user.avatarUrl
    ? { uri: item.user.avatarUrl }
    : Images.maleProfile;

  return (
    <View>
      <View
        style={[
          themedStyles.container,
          !item.user.username && themedStyles.centerContainer,
        ]}
      >
        <View style={themedStyles.userContainer}>
          <Image source={currentImage} style={themedStyles.image} />
          <View>
            <CustomText
              font="buttons"
              weight="medium"
              text={generateFullName(item.user)}
            />
            {item.user.username && (
              <CustomText
                font="chip"
                weight="regular"
                text={`@${item.user.username}`}
                overrideStyle={themedStyles.username}
              />
            )}
          </View>
        </View>
        <CustomText
          text={formattedDays}
          font="chip"
          weight="regular"
          overrideStyle={themedStyles.date}
        />
      </View>
      <StarDisplay rating={item.rating} />
      <CustomText
        text={item.comment}
        font="chip"
        weight="regular"
        overrideStyle={themedStyles.comment}
      />
    </View>
  );
};

export default ReviewItem;
