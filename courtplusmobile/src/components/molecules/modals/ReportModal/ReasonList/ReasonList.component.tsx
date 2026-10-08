import { CustomText, PressableScale } from "atoms/index";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { reportReasons } from "utils";
import styles from "./ReasonList.styles";
import { ReasonListProps } from "./ReasonList.types";
import { Images } from "theme";
import { useThemeContext } from "contexts";

const ReasonList = ({ onSelectReason }: ReasonListProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.group}>
        {reportReasons.map((reason, index) => (
          <PressableScale
            style={[
              themedStyles.listContainer,
              index < reportReasons.length - 1 && themedStyles.divider,
            ]}
            onPress={() => onSelectReason(reason)}
            scaleTo={0.98}
            accessibilityRole="button"
            key={reason.key}
          >
            <CustomText
              font="headline3"
              weight="medium"
              text={reason.title}
              overrideStyle={themedStyles.title}
            />
            <Image source={Images.arrowLeft} style={themedStyles.arrowIcon} />
          </PressableScale>
        ))}
      </View>
    </View>
  );
};

export default ReasonList;
