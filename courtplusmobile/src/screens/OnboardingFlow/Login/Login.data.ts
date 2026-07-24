import { t } from "i18next";
import * as yup from "yup";

export const loginSchema = yup.object().shape({
  phoneNumber: yup.string().required(t("general.requiredField")),
});

export type LoginFields = yup.InferType<typeof loginSchema>;
