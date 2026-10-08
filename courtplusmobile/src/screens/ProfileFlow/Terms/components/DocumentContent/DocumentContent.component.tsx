import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import { enterDrop, enterRise } from "utils";
import styles from "./DocumentContent.styles";
import { DocumentContentProps, DocumentSection } from "./DocumentContent.types";

const NUMBERED_HEADING = /^(\d+)[.)]\s*(.+)$/;

const parseSections = (content: string): DocumentSection[] =>
  content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [first, ...rest] = block.split("\n");
      const match = first.match(NUMBERED_HEADING);
      if (match) {
        return { number: match[1], title: match[2], body: rest.join("\n") };
      }
      return { body: block };
    });

const DocumentContent = ({ headline, content }: DocumentContentProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const sections = useMemo(() => parseSections(content), [content]);
  const firstNumbered = sections.findIndex((section) => !!section.number);
  const introCount = firstNumbered === -1 ? 0 : firstNumbered;
  const intro = sections.slice(0, introCount);
  const rows = sections.slice(introCount);

  return (
    <View style={themedStyles.container}>
      <Animated.View entering={enterDrop(0)} style={themedStyles.hero}>
        <View style={themedStyles.heroBadge}>
          <Image source={Images.logo} style={themedStyles.heroIcon} />
        </View>
        <CustomText
          text={headline}
          font="screenTitle"
          weight="extraBold"
          accessibilityRole="header"
          overrideStyle={themedStyles.headline}
        />
        {intro.map((section, index) => (
          <CustomText
            key={`intro-${index}`}
            text={section.body}
            font="headline3"
            weight="regular"
            overrideStyle={themedStyles.intro}
          />
        ))}
      </Animated.View>
      {rows.length > 0 && (
        <Animated.View entering={enterRise(1)} style={themedStyles.card}>
          {rows.map((section, index) => (
            <View
              key={`section-${index}`}
              style={[
                themedStyles.row,
                index < rows.length - 1 && themedStyles.rowDivider,
              ]}
            >
              {!!section.number && (
                <View style={themedStyles.numberBadge}>
                  <CustomText
                    text={section.number}
                    font="displayNumber"
                    weight="bold"
                    overrideStyle={themedStyles.number}
                  />
                </View>
              )}
              <View style={themedStyles.rowText}>
                {!!section.title && (
                  <CustomText
                    text={section.title}
                    font="cardTitle"
                    weight="semiBold"
                    overrideStyle={themedStyles.title}
                  />
                )}
                {!!section.body && (
                  <CustomText
                    text={section.body}
                    font="headline3"
                    weight="regular"
                    overrideStyle={themedStyles.body}
                  />
                )}
              </View>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
};

export default DocumentContent;
