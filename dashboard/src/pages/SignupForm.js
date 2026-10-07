import React, { useState } from "react";
import { Form, Input, Button } from "antd";
import { jwtDecode } from "jwt-decode";
import { signUpStaff } from "../actions/auth_actions";
import { useNotification } from "../modules/NotificationProvider";
import { notifyError } from "../utils/errorMessages";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SignUpForm = () => {
  const [loading, setLoading] = useState(false);
  const notify = useNotification(); // Access global notification function
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  const { t } = useTranslation();

  // A facility owner who registered on the marketing site arrives here from
  // the link in their email: /auth/signup?token=...&email=...
  // The backend ties the token to that exact address, so the email is
  // pre-filled and locked — editing it would only produce INVALID_INVITATION.
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("token") || undefined;
  const invitedEmail = searchParams.get("email") || undefined;
  const isInvited = Boolean(invitationToken);

  const onFinish = (values) => {
    setLoading(true);
    signUpStaff({
      ...values,
      email: invitedEmail || values.email,
      ...(invitationToken ? { token: invitationToken } : {}),
    })
      .then((res) => {
        // A tokened signup is already verified and already logged in — the
        // backend returns tokens directly, so sending this user to the email
        // verification screen would strand them on a code that never arrives.
        const data = res?.data ?? res;
        if (invitationToken && data?.accessToken) {
          const { accessToken, refreshToken, user } = data;
          try {
            const { exp, type: role } = jwtDecode(accessToken);
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("tokenExpiry", exp);
            localStorage.setItem("userData", JSON.stringify(user ?? {}));
            localStorage.setItem("role", role);
          } catch (e) {
            // If the token cannot be decoded, fall back to a normal sign-in
            // rather than leaving a half-written session behind.
            localStorage.clear();
            navigate("/auth/signin");
            return;
          }
          // Full reload so the app boots with the session in place.
          window.location.href = "/home";
          return;
        }
        // Signup now reports whether the code actually went out. It used to
        // return an empty body whatever happened, so the verification screen
        // claimed a code had been sent even when the send had failed.
        if (data && data.verificationSent === false) {
          notify("warning", t("auth.otp_not_sent"));
        }
        navigate(`/auth/verification?email=${encodeURIComponent(values.email)}`);
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
        <div className="auth-form">
          <h2>{isInvited ? t("auth.finish_setup") : t("auth.sign_up")}</h2>
          <Form
            layout="vertical"
            onFinish={onFinish}
            initialValues={invitedEmail ? { email: invitedEmail } : undefined}
          >
            <Form.Item label={t("auth.first_name")} name="firstName" rules={[{ required: true, min: 2, message: t("auth.first_name_min") }]}>
              <Input placeholder={t("auth.first_name_placeholder")} />
            </Form.Item>

            <Form.Item label={t("auth.last_name")} name="lastName" rules={[{ required: true, min: 2, message: t("auth.last_name_min") }]}>
              <Input placeholder={t("auth.last_name_placeholder")} />
            </Form.Item>

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
              <Input placeholder={t("auth.email_placeholder")} disabled={isInvited} />
            </Form.Item>

            <Form.Item
              label={t("auth.password")}
              name="password"
              rules={[
                { required: true, message: t("auth.password_required") },
                { min: 8, message: t("auth.password_min") },
              ]}
              hasFeedback
            >
              <Input.Password placeholder={t("auth.password_placeholder")} />
            </Form.Item>

            <Form.Item
              label={t("auth.confirm_password")}
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
              <Input.Password placeholder={t("auth.confirm_password_placeholder")} />
            </Form.Item>

            <Form.Item>
              <Button
                style={{ color: "#000" }}
                type="primary"
                htmlType="submit"
                block
                loading={loading}
              >
                Sign Up
              </Button>
            </Form.Item>
          </Form>
        </div>
        <h5>
          have an account?
          <Link className="active" to="/auth/signin">
            Join Now
          </Link>
        </h5>
      </div>

      <div className="auth-cover cover-signup">
        <img src="/assets/images/icons/icon-sport.png" alt="" />
        <h1>{t("auth.hero_title")}</h1>{" "}
        <p>
          Create a free account and get full access to hundred of courts around
          you. No credit card needed. Trusted by over 4,000 sports enthusiasts.
        </p>
        <img src="/assets/images/icons/avatars.png" alt="" />
      </div>
    </div>
  );
};

export default SignUpForm;
