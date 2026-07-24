import { Select } from "antd";
import { useTranslation } from "react-i18next";
import flagAr from "../../../assets/imgs/flags/ar.png";
import flagEn from "../../../assets/imgs/flags/en.png";
import "./LangSwitch.scss";

export default function LangSwitch() {
  const { i18n } = useTranslation();
  const activeLocale = i18n.language?.startsWith("ar") ? "ar" : "en";

  const handleLanguageChange = (locale) => {
    // i18next caches the choice in localStorage (i18nextLng);
    // reload so antd, layout and animations re-render in the new direction
    i18n.changeLanguage(locale).then(() => window.location.reload());
  };

  return (
    <Select
      variant="borderless"
      value={activeLocale}
      className="lang-selector"
      onChange={handleLanguageChange}
      options={[
        {
          value: "en",
          label: (
            <div className="lang-item">
              <img src={flagEn} alt="English" />
              <p>English</p>
            </div>
          ),
        },
        {
          value: "ar",
          label: (
            <div className="lang-item">
              <img src={flagAr} alt="العربية" />
              <p>عربي</p>
            </div>
          ),
        },
      ]}
    />
  );
}
