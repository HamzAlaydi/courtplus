import i18n from "translation/index";
import { t } from "i18next";

/**
 * Central API error-message mapper.
 *
 * Backend errors arrive as `{ statusCode, code }` (see
 * backend/src/modules/shared/exception-filter.ts). Every known code has a
 * human-friendly entry under `messages.*` in the translation files; anything
 * unknown falls back to a generic message so a raw code or a 500 text is
 * never rendered to the user.
 */
export const getApiErrorMessage = (code?: string | null): string => {
  if (code && i18n.exists(`messages.${code}`)) {
    return t(`messages.${code}`);
  }
  return t("messages.somethingWentWrong");
};

/** Message shown when the request never reached the server (offline/timeout). */
export const getNetworkErrorMessage = (): string => {
  return t("messages.networkError");
};
