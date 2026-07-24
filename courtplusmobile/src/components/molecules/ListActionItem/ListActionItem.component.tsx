import { useThemeContext } from "contexts";
import React, { Fragment, useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import styles from "./ListActionItem.styles";
import { CustomText } from "atoms/index";
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
      {list.map((item, index) => (
        <Fragment key={`${item.title}-${index}`}>
          <TouchableOpacity
            onPress={item.onPress}
            style={[
              themedStyles.itemContainer,
              index < list.length - 1 &&
                !showSeparator &&
                themedStyles.itemContainerPadding,
            ]}
          >
            <Image
              source={item.image}
              style={[themedStyles.image, overrideImageStyle]}
            />
            <View style={themedStyles.titleContainer}>
              <CustomText
                font="headline3"
                weight="medium"
                text={item.title}
                overrideStyle={overrideTextStyle}
              />
              {item.subtitle && item.subtitle}
            </View>
            {item.right && item.right}
          </TouchableOpacity>
          {showSeparator && <View style={themedStyles.separator} />}
        </Fragment>
      ))}
    </View>
  );
};

export default ListActionItem;
