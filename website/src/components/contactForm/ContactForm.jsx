// ContactForm.js
import React, { useState } from "react";
import { Form, Input, Button, Row, Col, message } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import contactBg from "@/assets/imgs/contactform.png";
import "./ContactForm.scss";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ContactForm = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  // A toast is the wrong primary signal here: it disappears after three
  // seconds, and the whole point of this submission is "now go open your
  // inbox". The panel below persists and names the address we sent to.
  const [submittedEmail, setSubmittedEmail] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Vendor registration, not a contact message. This used to POST to
      // /contact, which flattened the facility details into a free-text email
      // to Court+'s inbox and stored nothing — the owner got no reply and no
      // account. /vendors/register creates a real registration and emails the
      // owner a link into the vendor portal.
      //
      // NOTE: /contact is still used by the FAQs support form, so it is left
      // exactly as it was.
      const res = await fetch(`${API_URL}/vendors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          facilityName: values.facilityName,
          email: values.email,
          phoneNumber: values.phone,
          city: values.city,
        }),
      });
      if (!res.ok) {
        // 429 is the per-IP throttle and needs its own wording — "something
        // went wrong, try again" invites the user to hammer a blocked endpoint.
        throw new Error(res.status === 429 ? "rate_limited" : "failed");
      }
      message.success(t("vendor_form.success"));
      setSubmittedEmail(values.email);
      form.resetFields();
    } catch (err) {
      const msg =
        err?.message === "rate_limited"
          ? t("vendor_form.rate_limited")
          : t("vendor_form.error");
      setErrorMessage(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-form-container" id="contact-form">
      <Row gutter={[0, 0]}>
        <Col xs={24} md={12} className="left-section">
          {submittedEmail ? (
            <div className="vendor-success" role="status" aria-live="polite">
              <div className="vendor-success__icon" aria-hidden="true">
                <CheckOutlined />
              </div>
              <h2 className="vendor-success__title">
                {t("vendor_form.success_title")}
              </h2>
              <p className="vendor-success__text">
                {t("vendor_form.success_body")}
              </p>
              <p className="vendor-success__email">{submittedEmail}</p>
              <p className="vendor-success__hint">
                {t("vendor_form.success_hint")}
              </p>
              <Button
                type="link"
                className="vendor-success__again"
                onClick={() => setSubmittedEmail(null)}
              >
                {t("vendor_form.register_another")}
              </Button>
            </div>
          ) : (
          <>
          <h1 className="title">{t("contact_form.title")}</h1>
          <p className="subtitle">{t("contact_form.subtitle")}</p>
          {errorMessage ? (
            <div className="vendor-error" role="alert">
              {errorMessage}
            </div>
          ) : null}
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
          </>
          )}
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
