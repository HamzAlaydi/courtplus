import { Card, CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { Images } from "theme";
import styles from "./HomeCourt.styles";
import { HomeCourtProps } from "./HomeCourt.types";
import { convertDistance, getCourtImage } from "utils";
import { useTranslation } from "react-i18next";

const HomeCourt = ({ item, onPress }: HomeCourtProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), []);
  const { t } = useTranslation();

  const courtImage = getCourtImage(item);

  return (
    <Card overrideStyle={themedStyles.container} onPress={onPress}>
      <Image source={courtImage} style={themedStyles.image} />
      <CustomText
        font="headline3"
        weight="bold"
        text={item.name}
        overrideStyle={themedStyles.name}
      />
      <View style={themedStyles.rowContainer}>
        <View style={themedStyles.innerRowContainer}>
          <Image source={Images.location} />
          <CustomText
            text={item.branch.name}
            font="text"
            weight="medium"
            numberOfLines={1}
            overrideStyle={themedStyles.branchName}
          />
        </View>
        <View style={themedStyles.innerRowContainer}>
          <Image source={Images.star} />
          <CustomText
            font="text"
            weight="semiBold"
            text={`${item.avgRating}`}
            overrideStyle={themedStyles.rating}
          />
        </View>
      </View>
      <View style={themedStyles.distanceContainer}>
        <Image source={Images.discovery} />
        <CustomText
          font="text"
          weight="regular"
          text={`${convertDistance(item.distance)} ${t("general.away")}`}
          overrideStyle={themedStyles.distance}
        />
      </View>
    </Card>
  );
};

export default HomeCourt;
