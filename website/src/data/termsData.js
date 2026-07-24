// Terms and Conditions content is localized, so it lives in the translation files
// (src/assets/locales/{en,ar}/translation.json) under "terms_page.sections",
// with the shape [{ key, category, items: [{ question, answer }] }].
const getTermsData = (t) => t("terms_page.sections", { returnObjects: true });

export default getTermsData;
