import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    // The detector reports the full browser tag (en-US, ar-SA), so the backend
    // fetched /assets/locales/en-US.json on every load — a file that does not
    // exist. The SPA rewrite answered with index.html, which then failed to
    // parse as JSON, and the language switcher displayed the raw tag.
    supportedLngs: ["en", "ar"],
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    debug: false,
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    backend: {
      loadPath: "/assets/locales/{{lng}}.json",
    },
  });

export default i18n;
