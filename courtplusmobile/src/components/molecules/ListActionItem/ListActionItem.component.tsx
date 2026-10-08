import { useThemeContext } from "contexts";
import React, { Fragment, useMemo } from "react";
import { Image, View } from "react-native";
import styles from "./ListActionItem.styles";
import { CustomText, PressableScale } from "atoms/index";
import { ListActionItemProps } from "./ListActionItem.types";

const ListActionItem = ({
  list,
  overrideContainerStyle,
  overrideTextStyle,
  overrideImageStyle,
  showSeparator = false,
}: ListActionItemProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <View style={[themedStyles.container, overrideContainerStyle]}>
      {list.map((item, index) => {
        const isLast = index === list.length - 1;
        return (
          <Fragment key={`${item.title}-${index}`}>
            <PressableScale
              onPress={item.onPress}
              disabled={!item.onPress}
              scaleTo={0.98}
              style={[
                themedStyles.itemContainer,
                !isLast && !showSeparator && themedStyles.itemDivider,
              ]}
            >
              <View style={themedStyles.iconTile}>
                <Image
                  source={item.image}
                  style={[themedStyles.image, overrideImageStyle]}
                />
              </View>
              <View style={themedStyles.titleContainer}>
                <CustomText
                  font="headline3"
                  weight="medium"
                  text={item.title}
                  overrideStyle={[themedStyles.title, overrideTextStyle]}
                />
                {item.subtitle && item.subtitle}
              </View>
              {item.right && item.right}
            </PressableScale>
            {showSeparator && !isLast && (
              <View style={themedStyles.separator} />
            )}
          </Fragment>
        );
      })}
    </View>
  );
};

export default ListActionItem;
