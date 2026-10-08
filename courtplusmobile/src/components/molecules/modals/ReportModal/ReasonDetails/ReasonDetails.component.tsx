import React, { useMemo } from "react";
import { View } from "react-native";
import { ReasonDetailsProps } from "./ReasonDetails.types";
import { CustomButton, CustomText, TextArea } from "atoms/index";
import styles from "./ReasonDetails.styles";
import { useReasonDetails } from "./ReasonDetails.logic";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";

const ReasonDetails = ({ reason, onSubmit }: ReasonDetailsProps) => {
  const { showTextArea, isButtonDisabled, description, setDescription } =
    useReasonDetails(reason);
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.reasonChip}>
        <CustomText
          font="headline3"
          weight="semiBold"
          text={reason?.title}
          overrideStyle={themedStyles.reasonText}
        />
      </View>
      {!showTextArea && (
        <CustomText
          font="headline3"
          weight="regular"
          overrideStyle={themedStyles.description}
          text={t("report.reasonDetailsDescription")}
        />
      )}
      {showTextArea && (
        <TextArea
          value={description}
          onChangeText={setDescription}
          placeholder={t("report.reasonPlaceholder")}
          overrideStyle={themedStyles.textAreaContainer}
          overrideWrapperStyle={themedStyles.textArea}
          maxLength={120}
        />
      )}
      <View style={themedStyles.bottomContainer}>
        <CustomButton
          disabled={isButtonDisabled}
          title={t("general.submit")}
          variant={
            isButtonDisabled && showTextArea ? "disabledDark" : "primary"
          }
          onPress={() => onSubmit(description)}
        />
      </View>
    </View>
  );
};

export default ReasonDetails;
