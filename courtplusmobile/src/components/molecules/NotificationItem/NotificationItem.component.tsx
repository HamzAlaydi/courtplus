import React, { useMemo } from "react";
import { Image, Pressable, View } from "react-native";
import { NotificationItemProps } from "./NotificationItem.types";
import { Images } from "theme";
import { formatTime } from "utils";
import { useThemeContext } from "contexts";
import styles from "./NotificationItem.styles";
import { CustomButton, CustomText } from "atoms/index";
import { useNotificationItem } from "./NotificationItem.logic";

// Types whose fallback image is a user avatar; everything else gets a
// neutral bell instead of a misleading profile photo.
const socialTypes = ["follow", "post_like"];

const NotificationItem = ({ item, overrideStyle }: NotificationItemProps) => {
  const image = item.image
    ? { uri: item.image }
    : socialTypes.includes(item.type)
      ? Images.maleProfile
      : Images.notificationBell;
  const formattedTime = formatTime(item.createdAt);
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { notificationButton, onNotificationPress } = useNotificationItem({
    item,
  });

  return (
    <Pressable
      style={[themedStyles.item, overrideStyle]}
      onPress={onNotificationPress}
    >
      <View style={[themedStyles.container]}>
        <Image source={image} style={themedStyles.imageContainer} />
        <CustomText
          overrideStyle={themedStyles.content}
          text={`${item.content}. ${formattedTime}`}
          font="headline3"
          weight="medium"
        />
      </View>
      {notificationButton && (
        <CustomButton
          {...notificationButton}
          variant="dark"
          overrideStyle={themedStyles.button}
          overrideTextStyle={themedStyles.buttonText}
        />
      )}
    </Pressable>
  );
};

export default NotificationItem;
