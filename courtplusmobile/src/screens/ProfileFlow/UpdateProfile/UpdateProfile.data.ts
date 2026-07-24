import { t } from "i18next";
import * as yup from "yup";

export const updateProfileSchema = yup.object().shape({
  fullName: yup.string().required(t("general.requiredField")),
  username: yup.string().required(t("general.requiredField")),
  dateOfBirth: yup.string().required(t("general.requiredField")),
  gender: yup.string().required(t("general.requiredField")),
  bio: yup.string(),
});

export type UpdateProfileFields = yup.InferType<typeof updateProfileSchema>;
