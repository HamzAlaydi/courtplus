import { t } from "i18next";
import * as yup from "yup";

export const changePhoneSchema = yup.object().shape({
  phoneNumber: yup.string().required(t("general.requiredField")),
});

export type ChangePhoneFields = yup.InferType<typeof changePhoneSchema>;
