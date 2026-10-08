import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { NotificationItemProps } from "./NotificationItem.types";
import { Images } from "theme";
import { formatTime } from "utils";
import { useThemeContext } from "contexts";
import styles from "./NotificationItem.styles";
import { CustomButton, CustomText, PressableScale } from "atoms/index";
import { useNotificationItem } from "./NotificationItem.logic";

// Types whose fallback image is a user avatar; everything else gets a
// neutral bell instead of a misleading profile photo.
const socialTypes = ["follow", "post_like"];

const NotificationItem = ({ item, overrideStyle }: NotificationItemProps) => {
  const isSocial = socialTypes.includes(item.type);
  const formattedTime = formatTime(item.createdAt);
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { notificationButton, onNotificationPress } = useNotificationItem({
    item,
  });

  return (
    <PressableScale
      style={[themedStyles.item, overrideStyle]}
      onPress={onNotificationPress}
      scaleTo={0.98}
      accessibilityRole="button"
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={themedStyles.avatar} />
      ) : isSocial ? (
        <Image source={Images.maleProfile} style={themedStyles.avatar} />
      ) : (
        <View style={themedStyles.iconTile}>
          <Image source={Images.bell} style={themedStyles.icon} />
        </View>
      )}
      <View style={themedStyles.body}>
        <CustomText
          overrideStyle={themedStyles.content}
          text={item.content}
          font="headline3"
          weight="medium"
          numberOfLines={3}
        />
        <CustomText
          overrideStyle={themedStyles.time}
          text={formattedTime}
          font="caption"
          weight="regular"
        />
      </View>
      {notificationButton && (
        <CustomButton
          {...notificationButton}
          variant="secondary"
          size="small"
          overrideStyle={themedStyles.button}
          overrideTextStyle={themedStyles.buttonText}
        />
      )}
    </PressableScale>
  );
};

export default NotificationItem;
