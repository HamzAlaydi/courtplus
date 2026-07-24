import React, { useMemo } from "react";
import Modal from "react-native-modal";
import { Image, TouchableOpacity, View } from "react-native";
import { CustomText } from "atoms/index";
import { ContextActionMenuProps } from "./ContextActionMenu.types";
import { useThemeContext } from "contexts";
import styles from "./ContextActionMenu.styles";
import { Images } from "theme";

const ContextActionMenu = ({
  isVisible,
  onClose,
  items,
}: ContextActionMenuProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      useNativeDriver
      style={themedStyles.modal}
    >
      <View style={themedStyles.container}>
        {items.map((item, index) => (
          <View key={`${item.text}-${index}`}>
            <TouchableOpacity onPress={item.onPress} style={themedStyles.item}>
              <Image source={Images[item.icon]} />
              <CustomText text={item.text} font="headline3" weight="bold" />
            </TouchableOpacity>
            {index < items.length - 1 && (
              <View style={themedStyles.separator} />
            )}
          </View>
        ))}
      </View>
    </Modal>
  );
};

export default ContextActionMenu;
