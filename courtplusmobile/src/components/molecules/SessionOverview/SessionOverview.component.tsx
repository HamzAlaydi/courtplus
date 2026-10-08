import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { Fragment, useMemo } from "react";
import { Image, View } from "react-native";
import styles from "./SessionOverview.styles";
import { SessionOverviewProps } from "./SessionOverview.types";

const SessionOverview = ({
  sessions,
  overrideContainerStyle,
  overrideColumnStyle,
  isDividerBlack,
}: SessionOverviewProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <View style={[themedStyles.container, overrideContainerStyle]}>
      {sessions.map((session, index) => (
        <Fragment key={`session-${index}`}>
          <View style={[themedStyles.column, overrideColumnStyle]}>
            <View style={themedStyles.iconContainer}>
              <Image source={session.image} style={themedStyles.image} />
            </View>
            <CustomText
              font="displayNumber"
              weight="bold"
              text={session.title}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              overrideStyle={themedStyles.title}
            />
            <CustomText
              font="caption"
              weight="medium"
              text={session.subtitle}
              numberOfLines={2}
              overrideStyle={themedStyles.subtitle}
            />
          </View>
          {index < sessions.length - 1 && (
            <View
              style={[
                themedStyles.divider,
                isDividerBlack && themedStyles.dividerBlack,
              ]}
            />
          )}
        </Fragment>
      ))}
    </View>
  );
};

export default SessionOverview;
