import React, { Fragment, useMemo } from "react";
import Modal from "react-native-modal";
import { Image, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomText, PressableScale } from "atoms/index";
import { ContextActionMenuProps } from "./ContextActionMenu.types";
import { useThemeContext } from "contexts";
import styles, { MENU_OFFSET } from "./ContextActionMenu.styles";
import { Images } from "theme";
import { MOTION } from "utils";

const ContextActionMenu = ({
  isVisible,
  onClose,
  items,
}: ContextActionMenuProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { top } = useSafeAreaInsets();

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      useNativeDriver
      statusBarTranslucent
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={MOTION.state}
      animationOutTiming={MOTION.state}
      backdropTransitionInTiming={MOTION.state}
      backdropTransitionOutTiming={MOTION.state}
      backdropColor={colors.INK}
      backdropOpacity={0.2}
      style={[themedStyles.modal, { paddingTop: top + MENU_OFFSET }]}
    >
      <View style={themedStyles.container}>
        {items.map((item, index) => (
          <Fragment key={`${item.text}-${index}`}>
            <PressableScale
              onPress={item.onPress}
              scaleTo={0.98}
              accessibilityRole="menuitem"
              style={themedStyles.item}
            >
              <View style={themedStyles.iconTile}>
                <Image source={Images[item.icon]} style={themedStyles.icon} />
              </View>
              <CustomText
                text={item.text}
                font="headline3"
                weight="semiBold"
                numberOfLines={1}
                overrideStyle={themedStyles.text}
              />
            </PressableScale>
            {index < items.length - 1 && (
              <View style={themedStyles.separator} />
            )}
          </Fragment>
        ))}
      </View>
    </Modal>
  );
};

export default ContextActionMenu;
