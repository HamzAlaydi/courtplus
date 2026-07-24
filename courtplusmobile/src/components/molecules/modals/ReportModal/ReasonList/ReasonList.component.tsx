import { CustomText } from "atoms/index";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { reportReasons } from "utils";
import styles from "./ReasonList.styles";
import { ReasonListProps } from "./ReasonList.types";
import { Images } from "theme";
import { useThemeContext } from "contexts";

const ReasonList = ({ onSelectReason }: ReasonListProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  return (
    <View style={styles.container}>
      {reportReasons.map((reason) => (
        <TouchableOpacity
          style={styles.listContainer}
          onPress={() => onSelectReason(reason)}
          key={reason.key}
        >
          <CustomText
            font="headline3"
            weight="medium"
            text={reason.title}
            key={reason.key}
            overrideStyle={styles.title}
          />
          <Image
            source={Images.arrowLeft}
            style={[styles.arrowIcon, { tintColor: colors.BLACK }]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ReasonList;
