import "./Footer.scss";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import logo from "@/assets/imgs/logo-footer.png";
import appstoreImg from "@/assets/imgs/apps_store.png";
import googlestoreImg from "@/assets/imgs/google_store.png";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  return (
    <footer className={`footer ${isRtl ? "rtl" : ""}`}>
      <div className="footer-inner">
        {/* LEFT SECTION */}
        <div className="footer-left">
          <Link to="/">
            <img src={logo} alt="Court+" className="footer-logo" />
          </Link>

          <div className="footer-links">
            <Link to="/">{t("home")}</Link>
            <Link to="/players">{t("players")}</Link>
            <Link to="/journal">{t("journal")}</Link>
            <Link to="/faqs">{t("faqs")}</Link>
            <Link to="/contact-us">{t("contact_us")}</Link>
            <Link to="/terms">{t("terms_conditions")}</Link>
            <Link to="/privacy">{t("privacy_policy")}</Link>
          </div>
        </div>

        {/* RIGHT SECTION */}
        {/* TODO: replace with the real store listings once the app is published */}
        <div className="footer-right">
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={appstoreImg} alt="App Store" className="store-btn" />
          </a>
          <a
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={googlestoreImg} alt="Google Play" className="store-btn" />
          </a>
        </div>
      </div>
    </footer>
  );
}
