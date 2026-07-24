import React, { useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { ParticipantSlotProps } from "./ParticipantSlot.types";
import { Images } from "theme";
import { CustomText } from "atoms/index";
import { useThemeContext } from "contexts";
import styles from "./ParticipantSlot.styles";
import { useTranslation } from "react-i18next";
import ItemIcon from "molecules/ItemIcon/ItemIcon.component";

const ParticipantSlot = ({
  name,
  username,
  image,
  showUsername = true,
  onRemovePress,
  showRemoveButton = false,
}: ParticipantSlotProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();

  if (!name && !username && !image) {
    return (
      <View style={themedStyles.availableContainer}>
        <View style={themedStyles.container}>
          <Image source={Images.plus} style={themedStyles.icon} />
        </View>
        <CustomText
          text={t("general.available")}
          font="chip"
          weight="regular"
          overrideStyle={themedStyles.availableText}
        />
      </View>
    );
  }
  return (
    <View
      style={[
        themedStyles.availableContainer,
        showUsername && themedStyles.extraMargin,
      ]}
    >
      <ItemIcon
        icon={image}
        overrideStyle={themedStyles.image}
        overrideImageStyle={themedStyles.image}
      />
      <CustomText
        text={name!!}
        font="chip"
        weight="regular"
        numberOfLines={1}
        overrideStyle={themedStyles.name}
      />
      {showUsername && (
        <CustomText
          text={`@${username}`}
          font="text"
          weight="regular"
          overrideStyle={themedStyles.username}
          numberOfLines={1}
        />
      )}
      {showRemoveButton && (
        <TouchableOpacity
          style={themedStyles.closeButton}
          onPress={() => onRemovePress?.()}
        >
          <Image source={Images.close} style={themedStyles.closeIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ParticipantSlot;
