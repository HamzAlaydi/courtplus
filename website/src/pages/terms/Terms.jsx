import "./Terms.scss";
import { Row, Col, Menu } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import getTermsData from "../../data/termsData";
import Seo from "../../components/Seo";

export default function Terms() {
  const { t } = useTranslation();
  const [selectedKey, setSelectedKey] = useState("getting-started");
  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };
  const termsData = getTermsData(t);
  const selectedCategory =
    termsData.find((item) => item.key === selectedKey) || termsData[0];

  return (
    <div className="terms">
      <Seo titleKey="seo.terms_title" />
      <div className="hero">
        <h1 className="active">{t("terms_page.hero_title")}</h1>
        <p>{t("terms_page.hero_subtitle")}</p>
      </div>

      <div className="section terms-container">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Menu
              mode="vertical"
              selectedKeys={[selectedKey]}
              onClick={handleMenuClick}
              className="faq-menu"
            >
              {termsData.map((item) => (
                <Menu.Item key={item.key}>{item.category}</Menu.Item>
              ))}
            </Menu>
          </Col>
          <Col xs={24} md={16}>
            <div className="faq-list">
              {selectedCategory.items.map((section, index) => (
                <div className="faq-item" key={index}>
                  <h3 className="faq-question">{section.question}</h3>
                  <p className="faq-answer">{section.answer}</p>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
