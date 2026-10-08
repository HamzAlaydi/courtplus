import React, { useMemo } from "react";
import { Image, View } from "react-native";
import { ParticipantSlotProps } from "./ParticipantSlot.types";
import { Images } from "theme";
import { CustomText, PressableScale } from "atoms/index";
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
        <View style={themedStyles.labels}>
          <CustomText
            text={t("general.available")}
            font="caption"
            weight="medium"
            numberOfLines={1}
            overrideStyle={themedStyles.availableText}
          />
          {showUsername && <View style={themedStyles.usernamePlaceholder} />}
        </View>
      </View>
    );
  }
  return (
    <View style={themedStyles.availableContainer}>
      <ItemIcon
        icon={image}
        overrideStyle={themedStyles.ring}
        overrideImageStyle={themedStyles.image}
      />
      <View style={themedStyles.labels}>
        <CustomText
          text={name ?? ""}
          font="caption"
          weight="semiBold"
          numberOfLines={1}
          overrideStyle={themedStyles.name}
        />
        {showUsername && (
          <CustomText
            text={`@${username}`}
            font="caption"
            weight="regular"
            overrideStyle={themedStyles.username}
            numberOfLines={1}
          />
        )}
      </View>
      {showRemoveButton && (
        <PressableScale
          style={themedStyles.closeButton}
          onPress={() => onRemovePress?.()}
          hitSlop={10}
          accessibilityRole="button"
        >
          <Image source={Images.close} style={themedStyles.closeIcon} />
        </PressableScale>
      )}
    </View>
  );
};

export default ParticipantSlot;
