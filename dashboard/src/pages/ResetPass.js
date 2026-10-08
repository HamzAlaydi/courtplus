import { notifyError } from "../utils/errorMessages";
import { Form, Button, Input, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { resetPass, forgetPass } from "../actions/auth_actions"; // Adjust this import
import { useNotification } from "../modules/NotificationProvider";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export default function ResetPass() {
  const { t } = useTranslation();
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState();
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const email = urlParams.get("email");
    if (!email) {
      navigate("/auth/signin");
    } else {
      setEmail(email);
    }
  }, [location, navigate]);

  /* ================= OTP RESEND COUNTDOWN ================= */
  useEffect(() => {
    if (canResend) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [canResend]);

  const handleResendOtp = () => {
    forgetPass({ email })
      .then(() => {
        notify("success", t("settings.otpResent"));
        setTimer(60);
        setCanResend(false);
      })
      .catch((err) => {
        notify("error", err?.response?.data?.message || t("settings.otpResendFailed"));
      });
  };

  const onFinish = (values) => {
    setLoading(true);
    const formData = {
      code: values.code,
      email,
      newPassword: values.password,
    };

    console.log(formData);

    resetPass(formData)
      .then((res) => {
        // 201 { isValid:false, errorCode } means wrong code/e-mail.
        if (res && res.isValid === false) {
          notify("error", t(`errors.${res.errorCode}`, t("errors.INVALID_CODE")));
          return;
        }
        notify("success", t("auth.password_reset_success", "Password has been reset successfully."));
        navigate("/auth/signin");
      })
      .catch((err) => {
        notifyError(notify, err, t);
      })
      .finally(() => {
        setLoading(false);
      });
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
            <h2 className="auth-title">{t("auth.reset_title")}</h2>
            <p className="auth-lead">
              A verification code has been sent to <strong>{email}</strong>.
              Please enter it along with your new password.
            </p>

            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                name="code"
                label={t("auth.code")}
                rules={[{ required: true, message: t("auth.code_required") }]}
              >
                <Input placeholder={t("auth.code_placeholder")} />
              </Form.Item>

              <Form.Item
                label={t("auth.new_password")}
                name="password"
                rules={[
                  { required: true, message: t("auth.password_required") },
                  { min: 8, message: t("auth.password_min") },
                ]}
                hasFeedback
              >
                <Input.Password placeholder={t("auth.new_password_placeholder")} />
              </Form.Item>

              <Form.Item
                label={t("auth.confirm_new_password")}
                name="confirmPassword"
                dependencies={["password"]}
                rules={[
                  { required: true, message: t("auth.confirm_password_required") },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject("Passwords do not match!");
                    },
                  }),
                ]}
                hasFeedback
              >
                <Input.Password placeholder={t("auth.confirm_new_password_placeholder")} />
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
              <div className="auth-otp-actions">
                {canResend ? (
                  <Button type="link" onClick={handleResendOtp}>
                    {t("settings.resendCode")}
                  </Button>
                ) : (
                  <Text type="secondary">
                    {t("settings.resendIn")} {timer}s
                  </Text>
                )}
              </div>
            </Form>
          </div>

          <h5 className="auth-switch">
            Back to{" "}
            <Link className="active" to="/auth/signin">
              Sign In
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
}
