import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import styles from "./SportBadge.styles";
import { WidgetWrapper } from "molecules/index";
import { SportBadgeProps } from "./SportBadge.types";
import { mapSportItem } from "utils";
import { CustomText } from "atoms/index";
import { Images } from "theme";

const SportBadge = ({ sport, overrideStyle }: SportBadgeProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const sportItem = mapSportItem(sport);

  return (
    <WidgetWrapper overrideStyle={[themedStyles.sportContainer, overrideStyle]}>
      <View style={themedStyles.iconContainer}>
        <Image source={Images[sportItem.icon]} style={themedStyles.icon} />
      </View>
      <View>
        <CustomText
          font="headline3"
          weight="semiBold"
          text={sportItem.name}
          overrideStyle={themedStyles.title}
        />
        {sport.level && (
          <CustomText
            font="caption"
            weight="regular"
            text={sportItem.level}
            overrideStyle={themedStyles.subtitle}
          />
        )}
      </View>
    </WidgetWrapper>
  );
};

export default SportBadge;
