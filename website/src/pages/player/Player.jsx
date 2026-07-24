import { MdOutlineFileDownload } from "react-icons/md";
import "./Player.scss";

import mobileImg from "@/assets/imgs/mobile.png";
import playerMobileImg from "@/assets/imgs/player-mobile.png";

import appstoreImg from "@/assets/imgs/apps_store.png";
import googlestoreImg from "@/assets/imgs/google_store.png";

import appstoreDarkImg from "@/assets/imgs/apps_store-dark.png";
import googlestoreDarkImg from "@/assets/imgs/google_store-dark.png";

import playerWhyImg from "@/assets/imgs/player-why.png";

import Faqs from "../../components/faqs/Faqs";
import { useTranslation } from "react-i18next";
import Marque from "../../components/Marque";
import Seo from "../../components/Seo";

export default function Player() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  return (
    <div className={`player ${isRtl ? "rtl" : ""}`}>
      <Seo
        titleKey="seo.players_title"
        descriptionKey="seo.players_description"
      />

      {/* HERO SECTION */}
      <div className=" hero-section">
        <div className="flash-bg" />

        <div className="content">
          <div className="content-text">
            <h1>
              <span className="active">{t("player_hero_title_active")}</span>{" "}
              {t("player_hero_title_rest")}
            </h1>

            <h5>{t("player_hero_subtitle")}</h5>

            {/* TODO: replace with the real store listings once the app is published */}
            <div>
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img className="img-app" src={appstoreImg} alt="appstore" />
              </a>
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="img-app"
                  src={googlestoreImg}
                  alt="googlestore"
                />
              </a>
            </div>
          </div>
        </div>

        <img className="img-main" src={playerMobileImg} alt="player app" />
      </div>

      {/* HOW IT WORKS */}
      <div className=" works">
        <div>
          <h1>{t("player_how_title")}</h1>
          <h6>{t("player_how_subtitle")}</h6>
        </div>

        <div className="content">
          {/* Left Steps */}
          <div className="steps">
            <div className="step">
              <MdOutlineFileDownload color="#a9e23c" size={34} />
              <h4>{t("player_step1_title")}</h4>
              <h6>{t("player_step1_text")}</h6>
            </div>

            <div className="step">
              <MdOutlineFileDownload color="#a9e23c" size={34} />
              <h4>{t("player_step2_title")}</h4>
              <h6>{t("player_step2_text")}</h6>
            </div>

            <div className="step">
              <MdOutlineFileDownload color="#a9e23c" size={34} />
              <h4>{t("player_step3_title")}</h4>
              <h6>{t("player_step3_text")}</h6>
            </div>
          </div>

          <img src={mobileImg} alt="mobile app" />

          {/* Right Steps */}
          <div className="steps">
            <div className="step">
              <MdOutlineFileDownload color="#a9e23c" size={34} />
              <h4>{t("player_step4_title")}</h4>
              <h6>{t("player_step4_text")}</h6>
            </div>

            <div className="step">
              <MdOutlineFileDownload color="#a9e23c" size={34} />
              <h4>{t("player_step5_title")}</h4>
              <h6>{t("player_step5_text")}</h6>
            </div>
          </div>
        </div>
      </div>

      {/* WHY SECTION */}
      <div className="section why">
        <div className="container">
          <div className="content">
            <h5>{t("player_why_title")}</h5>

            <h2>
              {t("player_why_highlight1")} <strong>Court+</strong>{" "}
              {t("player_why_highlight2")}
            </h2>

            <p>{t("player_why_p1")}</p>
            <p>{t("player_why_p2")}</p>
          </div>

          <img src={playerWhyImg} alt="why court+" />
        </div>

        <div className="apps">
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="img-app"
              src={appstoreDarkImg}
              alt="appstore dark"
            />
          </a>
          <a
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="img-app"
              src={googlestoreDarkImg}
              alt="google dark"
            />
          </a>
        </div>
      </div>

      <Marque />
      <Faqs />
    </div>
  );
}
