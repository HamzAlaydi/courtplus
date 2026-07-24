import { useSocial } from "hooks";
import { useTranslation } from "react-i18next";

export const useOnBoardingFooter = (type: "login" | "register") => {
  const { t } = useTranslation();
  const { onGoogleLogin } = useSocial(type === "login");

  const description =
    type === "login" ? t("auth.noAccount") : t("auth.haveAccount");
  const buttonText = type === "login" ? t("auth.signUp") : t("auth.signIn");

  return {
    description,
    buttonText,
    onGoogleLogin,
  };
};
