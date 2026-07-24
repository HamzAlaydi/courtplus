import { Select } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function LangSwitch() {
  const { i18n } = useTranslation();
  const [activeLocale, setActiveLocale] = useState(i18n.language || "en");

  const handleLanguageChange = (locale) => {
    i18n.changeLanguage(locale);
    setActiveLocale(locale);
  };

  return (
    <Select
      style={{ width: 130 }}
      variant="borderless"
      value={activeLocale}
      className="lang-selector"
      onChange={handleLanguageChange}
      options={[
        {
          value: "en",
          label: (
            <div className="lang-item">
              <img src="/assets/images/flags/en.png" alt="" />
              <p>English</p>
            </div>
          ),
        },
        {
          value: "ar",
          label: (
            <div className="lang-item">
              <img src="/assets/images/flags/ar.png" alt="" />
              <p>عربي</p>
            </div>
          ),
        },
      ]}
    />
  );
}
