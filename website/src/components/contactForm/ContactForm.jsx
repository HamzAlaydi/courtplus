// ContactForm.js
import React, { useState } from "react";
import { Form, Input, Button, Row, Col, message } from "antd";
import { useTranslation } from "react-i18next";
import contactBg from "@/assets/imgs/contactform.png";
import "./ContactForm.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ContactForm = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const name = [values.firstName, values.lastName]
        .filter(Boolean)
        .join(" ");
      const details = [
        `Facility: ${values.facilityName}`,
        values.phone && `Phone: ${values.phone}`,
        values.city && `City: ${values.city}`,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: values.email,
          subject: values.facilityName,
          message: details,
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

  return (
    <div className="contact-form-container" id="contact-form">
      <Row gutter={[0, 0]}>
        <Col xs={24} md={12} className="left-section">
          <h1 className="title">{t("contact_form.title")}</h1>
          <p className="subtitle">{t("contact_form.subtitle")}</p>
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item
              name="firstName"
              rules={[
                { required: true, message: t("contact_form.required") },
              ]}
            >
              <Input placeholder={t("contact_form.first_name")} />
            </Form.Item>
            <Form.Item name="lastName">
              <Input placeholder={t("contact_form.last_name")} />
            </Form.Item>
            <Form.Item
              name="facilityName"
              rules={[
                { required: true, message: t("contact_form.required") },
              ]}
            >
              <Input placeholder={t("contact_form.facility_name")} />
            </Form.Item>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: t("contact_form.required") },
                { type: "email", message: t("contact_form.invalid_email") },
              ]}
            >
              <Input placeholder={t("contact_form.email")} />
            </Form.Item>
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: t("contact_form.required") },
              ]}
            >
              <Input placeholder={t("contact_form.phone")} />
            </Form.Item>
            <Form.Item name="city">
              <Input placeholder={t("contact_form.city")} />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="submit-button"
              loading={loading}
            >
              {t("contact_form.submit")}
            </Button>
          </Form>
        </Col>
        <Col xs={24} md={12} className="right-section">
          <div className="image-placeholder">
            <img src={contactBg} alt="Person using phone on court" />
          </div>
          <p className="quote">
            {t("contact_form.quote")}
            <br />
            {t("contact_form.quote_author")}
          </p>
        </Col>
      </Row>
    </div>
  );
};

export default ContactForm;
