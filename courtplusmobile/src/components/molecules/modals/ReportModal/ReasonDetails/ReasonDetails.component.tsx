import React from "react";
import { View } from "react-native";
import { ReasonDetailsProps } from "./ReasonDetails.types";
import { CustomButton, CustomText, TextArea } from "atoms/index";
import styles from "./ReasonDetails.styles";
import { useReasonDetails } from "./ReasonDetails.logic";
import { useTranslation } from "react-i18next";

const ReasonDetails = ({ reason, onSubmit }: ReasonDetailsProps) => {
  const { showTextArea, isButtonDisabled, description, setDescription } =
    useReasonDetails(reason);
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <CustomText font="headline3" weight="medium" text={reason?.title} />
      {!showTextArea && (
        <CustomText
          font="headline3"
          weight="regular"
          overrideStyle={styles.description}
          text={t("report.reasonDetailsDescription")}
        />
      )}
      {showTextArea && (
        <TextArea
          value={description}
          onChangeText={setDescription}
          placeholder={t("report.reasonPlaceholder")}
          overrideWrapperStyle={styles.textArea}
          maxLength={120}
        />
      )}
      <View style={styles.bottomContainer}>
        <CustomButton
          disabled={isButtonDisabled}
          title={t("general.submit")}
          variant={isButtonDisabled && showTextArea ? "disabledDark" : "dark"}
          onPress={() => onSubmit(description)}
        />
      </View>
    </View>
  );
};

export default ReasonDetails;
