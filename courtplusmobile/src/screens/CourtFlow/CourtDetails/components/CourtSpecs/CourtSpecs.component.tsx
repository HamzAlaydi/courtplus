import React, { useMemo } from "react";
import { Image, View } from "react-native";
import styles from "./CourtSpecs.styles";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { Images } from "theme";
import { CourtSpecsProps } from "./CourtSpecs.types";
import { useTranslation } from "react-i18next";

const CourtSpecs = ({ surface, widthSingles, long }: CourtSpecsProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  const list = [
    {
      image: Images.court,
      title: t("court.type"),
      description: surface,
    },
    {
      image: Images.width,
      title: t("court.width"),
      description: `${widthSingles} ${t("general.meters")}`,
    },
    {
      image: Images.long,
      title: t("court.long"),
      description: `${long} ${t("general.meters")}`,
    },
  ];

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.whiteContainer}>
        <Image source={Images.tennisCourt} style={themedStyles.image} />
        <View style={themedStyles.whiteContainerContent}>
          {list.map((item) => (
            <View
              key={`specs-${item.title}`}
              style={themedStyles.whiteContainerContentItem}
            >
              <View style={themedStyles.specsItemContainer}>
                <Image source={item.image} style={themedStyles.specsImage} />
                <CustomText
                  text={item.title}
                  overrideStyle={{
                    color: "#9399A3",
                  }}
                  font="body"
                  weight="medium"
                />
              </View>

              <CustomText
                text={item.description}
                font="headline2"
                weight="semiBold"
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default CourtSpecs;
