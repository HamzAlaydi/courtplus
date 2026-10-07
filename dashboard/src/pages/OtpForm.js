import { notifyError } from "../utils/errorMessages";
import { Form, Button, Input, Modal, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  verifyStaff,
  resendVerificationCode,
  changeUnverifiedEmail,
} from "../actions/auth_actions";
import { useNotification } from "../modules/NotificationProvider";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

// Must match VerificationService's `codeLength` default. The copy here used
// to promise an 8-digit code while the field accepted 6 and the backend
// issued 6.
const CODE_LENGTH = 6;

export default function OtpForm() {
  const { t } = useTranslation();
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState();
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const [changeForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract the email from the URL query params
    const urlParams = new URLSearchParams(location.search);
    const email = urlParams.get("email");

    // If email parameter doesn't exist, navigate to /auth/signin
    if (!email) {
      navigate("/auth/signin");
    } else {
      setEmail(email);
    }
  }, [location, navigate]); // Depend on location to handle any changes to the URL

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
    resendVerificationCode({ email })
      .then(() => {
        notify("success", t("settings.otpResent"));
        setTimer(60);
        setCanResend(false);
      })
      .catch((err) => {
        // A server-side lockout (429) and a mail outage (503) used to look
        // identical here — both showed the same flat "Failed to resend".
        notifyError(notify, err, t);
      });
  };

  const onChangeEmail = (values) => {
    setChanging(true);
    changeUnverifiedEmail({
      email,
      password: values.password,
      newEmail: values.newEmail,
    })
      .then((res) => {
        const data = res?.data ?? res;
        setChangeOpen(false);
        changeForm.resetFields();
        if (data && data.verificationSent === false) {
          notify("warning", t("auth.otp_not_sent"));
        } else {
          notify("success", t("auth.otp_email_changed"));
        }
        // Re-point the screen at the corrected address and restart the
        // cooldown, so Resend targets the new inbox.
        navigate(
          `/auth/verification?email=${encodeURIComponent(values.newEmail)}`,
          { replace: true }
        );
        setTimer(60);
        setCanResend(false);
      })
      .catch((err) => {
        notifyError(notify, err, t);
      })
      .finally(() => setChanging(false));
  };

  const onFinish = (values) => {
    setLoading(true);
    const formData = {
      code: values.code,
      email: email,
      context: "account_verification",
    };

    verifyStaff(formData)
      .then((res) => {
        // The API answers 201 with { verified:false, errorCode } for a wrong
        // or expired code; this used to say "Success" and redirect anyway.
        if (res && res.verified === false) {
          notify("error", t(`errors.${res.errorCode}`, t("errors.INVALID_CODE")));
          return;
        }
        notify("success", t("auth.verified", "Your account is verified — you can sign in now."));
        navigate("/auth/signin");
      })
      .catch((err) => {
        notifyError(notify, err, t);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="auth-layout">
      <div className="auth-form-container">
        <div className="auth-form-header">
          <img src="/assets/images/logo-horizontal.png" alt="" />
          <img src="/assets/images/icons/auth-key.png" alt="" />
        </div>
        <h2>{t("auth.otp_title")}</h2>

        <div className="auth-form">
          <p style={{ marginBottom: "2rem" }}>
            {t("auth.otp_sent_to", { email })}
          </p>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="code"
              // Without this an incomplete entry was posted, came back as
              // "incorrect code", and burned one of only six attempts before
              // a one-hour lockout.
              rules={[
                {
                  required: true,
                  len: CODE_LENGTH,
                  message: t("auth.otp_code_required"),
                },
              ]}
            >
              <Input.OTP size="large" length={CODE_LENGTH} />
            </Form.Item>
            <Form.Item>
              <Button
                style={{ color: "#000" }}
                type="primary"
                htmlType="submit"
                block
                loading={loading}
              >
                {t("auth.otp_submit")}
              </Button>
            </Form.Item>
            <div style={{ textAlign: "center", marginTop: 12 }}>
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
            <div style={{ textAlign: "center", marginTop: 4 }}>
              <Text type="secondary">{t("auth.otp_wrong_email")}</Text>
              <Button type="link" onClick={() => setChangeOpen(true)}>
                {t("auth.otp_change_email")}
              </Button>
            </div>
          </Form>
        </div>
        <h5>
          {t("auth.have_account")}
          <Link className="active" to="/auth/signin">
            {t("auth.sign_in")}
          </Link>
        </h5>
      </div>

      <Modal
        open={changeOpen}
        title={t("auth.otp_change_email_title")}
        onCancel={() => setChangeOpen(false)}
        onOk={() => changeForm.submit()}
        confirmLoading={changing}
        okText={t("auth.otp_change_email")}
        destroyOnClose
      >
        <p>{t("auth.otp_change_email_hint")}</p>
        <Form form={changeForm} layout="vertical" onFinish={onChangeEmail}>
          <Form.Item
            label={t("auth.password")}
            name="password"
            rules={[{ required: true, min: 8, message: t("auth.password_min") }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label={t("auth.otp_new_email")}
            name="newEmail"
            rules={[
              { required: true, type: "email", message: t("auth.email_invalid") },
            ]}
          >
            <Input autoComplete="email" />
          </Form.Item>
        </Form>
      </Modal>

      <div className="auth-cover cover-signup">
        <img src="/assets/images/icons/icon-sport.png" alt="" />
        <h1>{t("auth.hero_title")}</h1>{" "}
        <p>{t("auth.hero_subtitle")}</p>
        <img src="/assets/images/icons/avatars.png" alt="" />
      </div>
    </div>
  );
}
