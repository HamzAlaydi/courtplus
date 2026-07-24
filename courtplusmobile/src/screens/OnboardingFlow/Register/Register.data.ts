import { t } from "i18next";
import * as yup from "yup";

export const registerSchema = yup.object().shape({
  fullName: yup
    .string()
    .required(t("general.requiredField"))
    .test("fullname-match", t("form.name"), (value) => {
      const regex = /^[A-Za-z\s]+$/;
      return regex.test(value);
    }),
  username: yup.string().required(t("general.requiredField")),
  dateOfBirth: yup.string(),
  gender: yup.string().required(t("general.requiredField")),
  phoneNumber: yup.string().required(t("general.requiredField")),
});

export type RegisterFields = yup.InferType<typeof registerSchema>;
