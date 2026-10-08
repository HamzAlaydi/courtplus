import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import styles from "./ActivityLogItem.styles";
import { ActivityLogItemProps } from "./ActivityLogItem.types";

const ActivityLogItem = ({ overrideStyle }: ActivityLogItemProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <View style={[themedStyles.container, overrideStyle]}>
      <View style={themedStyles.imageContainer} />
      <View style={themedStyles.details}>
        <Text style={themedStyles.description}>
          <CustomText
            text="Elizabeth Chandra entering to the booked court "
            font="headline3"
            weight="medium"
          />
          <CustomText
            text="Tennis Outdoor Court A"
            font="headline3"
            weight="semiBold"
            overrideStyle={themedStyles.court}
          />
        </Text>
        <CustomText
          text="2 days ago"
          font="caption"
          weight="regular"
          overrideStyle={themedStyles.timestamp}
        />
      </View>
    </View>
  );
};

export default ActivityLogItem;
