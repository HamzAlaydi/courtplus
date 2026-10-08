import React, { useMemo } from "react";
import { Image, ImageSourcePropType, View } from "react-native";
import styles from "./CourtSpecs.styles";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import { Images } from "theme";
import { CourtSpecsProps } from "./CourtSpecs.types";
import { useTranslation } from "react-i18next";

type SpecItem = {
  image: ImageSourcePropType;
  title: string;
  description: string;
  highlight?: boolean;
};

const CourtSpecs = ({
  surface,
  widthSingles,
  long,
  isAirConditioned,
  isWomenOnly,
}: CourtSpecsProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  const list: SpecItem[] = [
    {
      image: Images.court,
      title: t("court.type"),
      description: surface
        ? t(`court.surfaces.${surface}`, {
            defaultValue: `${surface.charAt(0).toUpperCase()}${surface.slice(
              1
            )}`,
          })
        : "",
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
    {
      image: Images.airConditioner,
      title: t("court.airConditioning"),
      description: isAirConditioned
        ? t("court.airConditioned")
        : t("court.notAirConditioned"),
      highlight: !!isAirConditioned,
    },
    {
      image: Images.womenOnly,
      title: t("court.womenOnly"),
      description: isWomenOnly
        ? t("court.womenOnlyYes")
        : t("court.womenOnlyNo"),
      highlight: !!isWomenOnly,
    },
  ];

  return (
    <View style={themedStyles.container}>
      <Image source={Images.tennisCourt} style={themedStyles.image} />
      <View style={themedStyles.list}>
        {list.map((item, index) => (
          <View
            key={`specs-${item.title}`}
            style={[
              themedStyles.row,
              index < list.length - 1 && themedStyles.rowDivider,
            ]}
          >
            <View style={themedStyles.iconTile}>
              <Image source={item.image} style={themedStyles.specsImage} />
            </View>
            <CustomText
              text={item.title}
              font="headline3"
              weight="medium"
              numberOfLines={2}
              overrideStyle={themedStyles.title}
            />
            {item.highlight ? (
              <View style={themedStyles.pill}>
                <CustomText
                  text={item.description}
                  font="caption"
                  weight="semiBold"
                  numberOfLines={1}
                  overrideStyle={themedStyles.pillText}
                />
              </View>
            ) : (
              <CustomText
                text={item.description}
                font="headline3"
                weight="semiBold"
                numberOfLines={2}
                overrideStyle={themedStyles.value}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default CourtSpecs;
