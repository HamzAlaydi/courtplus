import "./Faqs.scss";
import { Row, Col, Menu, Collapse, Form, Input, Button, message } from "antd";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Seo from "../../components/Seo";

const { Panel } = Collapse;
const { TextArea } = Input;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Faqs() {
  const { t } = useTranslation();
  const [selectedKey, setSelectedKey] = useState("getting-started");
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const faqData = t("faqs_page.categories", { returnObjects: true });

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          message: values.phone
            ? `${values.message}\n\nPhone: ${values.phone}`
            : values.message,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      message.success(t("contact_form.success"));
      form.resetFields();
    } catch {
      message.error(t("contact_form.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
  };

  const selectedCategory =
    faqData.find((item) => item.key === selectedKey) || faqData[0];

  return (
    <div className="faqs-page">
      <Seo titleKey="seo.faqs_title" descriptionKey="seo.faqs_description" />

      <div className="hero">
        <div className="flash-bg" />

        <h1>
          <span className="active">{t("faqs_page.hero_title_active")}</span>
          <br /> {t("faqs_page.hero_title_rest")}
        </h1>
        <h5>{t("faqs_page.hero_subtitle")}</h5>
      </div>

      <div className="section faq-container">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Menu
              mode="vertical"
              selectedKeys={[selectedKey]}
              onClick={handleMenuClick}
              className="faq-menu"
            >
              {faqData.map((item) => (
                <Menu.Item key={item.key}>{item.category}</Menu.Item>
              ))}
            </Menu>
          </Col>
          <Col xs={24} md={18}>
            <div className="faq-content">
              <h2>{selectedCategory.category}</h2>
              <Collapse accordion={false} expandIconPosition="end">
                {selectedCategory.items.map((faq, index) => (
                  <Panel header={faq.question} key={index}>
                    <p>{faq.answer}</p>
                  </Panel>
                ))}
              </Collapse>
            </div>
          </Col>
        </Row>
      </div>

      <div className="contact-support">
        {/* Left: Text */}
        <div>
          <div className="contact-text">
            <h2>{t("faqs_page.not_found_title")}</h2>
            <div>
              <h4 className="active">{t("faqs_page.still_questions")}</h4>
              <p>{t("faqs_page.leave_details")}</p>
            </div>
            <div>
              <p className="active">{t("faqs_page.team_contact")}</p>
              <p>
                {t("faqs_page.prefer_direct")}{" "}
                <a href="mailto:support@courtplusapp.com" className="email-link">
                  support@courtplusapp.com
                </a>
              </p>
            </div>
          </div>
        </div>
        {/* Right: Form */}

        <div className="contact-form-card">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            className="contact-form"
          >
            <Form.Item
              name="name"
              rules={[
                { required: true, message: t("faqs_page.name_required") },
              ]}
            >
              <Input placeholder={t("faqs_page.full_name")} size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: t("faqs_page.email_required") },
                { type: "email", message: t("faqs_page.email_invalid") },
              ]}
            >
              <Input placeholder={t("faqs_page.email_address")} size="large" />
            </Form.Item>

            <Form.Item name="phone">
              <Input placeholder={t("faqs_page.phone_optional")} size="large" />
            </Form.Item>

            <Form.Item
              name="message"
              rules={[
                { required: true, message: t("faqs_page.message_required") },
              ]}
            >
              <TextArea
                placeholder={t("faqs_page.message_placeholder")}
                rows={4}
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="submit-btn"
                loading={loading}
                block
              >
                {t("faqs_page.submit")}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
