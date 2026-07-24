import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import React, { Fragment, useMemo } from "react";
import { Image, View } from "react-native";
import { Images } from "theme";
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
              <CustomText
                font="headline3"
                weight="semiBold"
                text={session.title}
              />
            </View>
            <CustomText
              font="chip"
              weight="semiBold"
              text={session.subtitle}
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
