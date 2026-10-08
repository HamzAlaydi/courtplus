import { useTranslation } from "react-i18next";
import { notifyError } from "../utils/errorMessages";
import { useState } from "react";
import { Form, Input, Button } from "antd";
import { forgetPass } from "../actions/auth_actions";
import { useNotification } from "../modules/NotificationProvider";
import { Link, useNavigate } from "react-router-dom";

const ForgetPass = () => {
  const [loading, setLoading] = useState(false);
  const notify = useNotification(); // Access global notification function
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  const { t } = useTranslation();
  const onFinish = (values) => {
    setLoading(true);
    forgetPass(values)
      .then(() => {
        // Unencoded, a "+" in the address became a space and the reset never matched.
        navigate(`/auth/reset-password?email=${encodeURIComponent(values.email)}`);
      })
      .catch((err) => {
        notifyError(notify, err, t);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="auth-layout">
      <div className="auth-form-container">
        <div className="auth-card">
          <div className="auth-form-header">
            <img
              className="auth-logo"
              src="/assets/images/logo-horizontal.png"
              alt="Court+"
            />
            <span className="auth-key">
              <img src="/assets/images/icons/auth-key.png" alt="" />
            </span>
          </div>
          <div className="auth-form">
            <h2 className="auth-title">{t("auth.forgot_title")}</h2>
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                label={t("auth.email")}
                name="email"
                rules={[
                  {
                    required: true,
                    type: "email",
                    message: t("auth.email_invalid"),
                  },
                ]}
              >
                <Input placeholder={t("auth.email_placeholder")} />
              </Form.Item>

              <Form.Item>
                <Button
                  className="cp-btn-display"
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                >
                  Reset Password
                </Button>
              </Form.Item>
            </Form>
          </div>
          <h5 className="auth-switch">
            have an account?
            <Link className="active" to="/auth/signin">
              Join Now
            </Link>
          </h5>
        </div>
      </div>

      <div className="auth-cover cover-signup">
        <span className="auth-cover-mark" dir="ltr">
          court<span>+</span>
        </span>
        <div className="auth-cover-body">
          <img
            className="auth-cover-icon"
            src="/assets/images/icons/icon-sport.png"
            alt=""
          />
          <h1>{t("auth.hero_title")}</h1>
          <p>{t("auth.hero_subtitle")}</p>
          <img
            className="auth-cover-avatars"
            src="/assets/images/icons/avatars.png"
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

export default ForgetPass;
