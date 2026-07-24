import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { NotificationItemProps } from "./NotificationItem.types";
import { Images } from "theme";
import { formatTime } from "utils";
import { useThemeContext } from "contexts";
import styles from "./NotificationItem.styles";
import { CustomButton, CustomText } from "atoms/index";
import { useNotificationItem } from "./NotificationItem.logic";

const NotificationItem = ({ item, overrideStyle }: NotificationItemProps) => {
  const image = item.image ? { uri: item.image } : Images.maleProfile;
  const formattedTime = formatTime(item.createdAt);
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { notificationButton } = useNotificationItem({ item });

  return (
    <View style={[themedStyles.item, overrideStyle]}>
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
    </View>
  );
};

export default NotificationItem;
