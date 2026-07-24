import React from "react";
import { Collapse } from "antd";
import "./Faqs.scss";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const { Panel } = Collapse;

export default function Faqs() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  // FAQ list from translations
  const faqList = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
    { q: t("faq_q5"), a: t("faq_a5") },
  ];

  return (
    <div className={`section faqs ${isRtl ? "rtl" : ""}`}>
      <div className="flash-bg" />

      <h2>{t("got_questions")}</h2>
      <h5>{t("faqs_subtitle")}</h5>

      <Collapse accordion bordered={false} className="faqs-collapse">
        {faqList.map((item, i) => (
          <Panel header={item.q} key={i}>
            <p>{item.a}</p>
          </Panel>
        ))}
      </Collapse>

      <div className="category-label">{t("sports_facility_owners")}</div>

      <Link to="/faqs" className="btn load-more">
        <PlusCircleOutlined /> {t("load_more")}
      </Link>
    </div>
  );
}
