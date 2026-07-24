// Privacy Policy content is localized, so it lives in the translation files
// (src/assets/locales/{en,ar}/translation.json) under "privacy_page.sections",
// with the same shape as termsData: [{ key, category, items: [{ question, answer }] }].
const getPrivacyData = (t) => t("privacy_page.sections", { returnObjects: true });

export default getPrivacyData;
