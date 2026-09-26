import { t } from "i18next";
import * as yup from "yup";

export const registerSchema = yup.object().shape({
  fullName: yup
    .string()
    .required(t("general.requiredField"))
    .test("fullname-match", t("form.name"), (value) => {
      // Any script (Arabic names!), plus apostrophes/hyphens as in Al-Ghamdi.
      const regex = /^[\p{L}\p{M}\s'.-]+$/u;
      return regex.test(value);
    }),
  username: yup.string().required(t("general.requiredField")),
  dateOfBirth: yup.string().required(t("general.requiredField")),
  gender: yup.string().required(t("general.requiredField")),
  phoneNumber: yup.string().required(t("general.requiredField")),
});

export type RegisterFields = yup.InferType<typeof registerSchema>;
