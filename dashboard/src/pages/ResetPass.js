import { Form, Button, Input } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { resetPass } from "../actions/auth_actions"; // Adjust this import
import { useNotification } from "../modules/NotificationProvider";

export default function ResetPass() {
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState();
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

  const onFinish = (values) => {
    setLoading(true);
    const formData = {
      code: values.code,
      email,
      newPassword: values.password,
    };

    console.log(formData);

    resetPass(formData)
      .then(() => {
        notify("success", "Password has been reset successfully.");
        navigate("/auth/signin");
      })
      .catch((err) => {
        console.log(err);
        notify("error", err?.response?.data?.message || "Reset failed.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="auth-layout">
      <div className="auth-form-container">
        <div className="auth-form-header">
          <img src="/assets/images/logo-horizontal.png" alt="" />
          <img src="/assets/images/icons/auth-key.png" alt="" />
        </div>
        <h2>Reset Your Password</h2>

        <div className="auth-form">
          <p style={{ marginBottom: "2rem" }}>
            A verification code has been sent to <strong>{email}</strong>.
            Please enter it along with your new password.
          </p>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="code"
              label="Verification Code"
              rules={[{ required: true, message: "Code is required" }]}
            >
              <Input placeholder="Enter the 6-digit code" />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="password"
              rules={[
                { required: true, message: "Please enter your password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
              hasFeedback
            >
              <Input.Password placeholder="Enter new password" />
            </Form.Item>

            <Form.Item
              label="Confirm New Password"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
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
              <Input.Password placeholder="Confirm new password" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{ color: "#000" }}
              >
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </div>

        <h5>
          Back to{" "}
          <Link className="active" to="/auth/signin">
            Sign In
          </Link>
        </h5>
      </div>

      <div className="auth-cover cover-signup">
        <img src="/assets/images/icons/icon-sport.png" alt="" />
        <h1>Start swinging your racket into happiness.</h1>
        <p>
          Create a free account and get full access to hundreds of courts around
          you. No credit card needed. Trusted by over 4,000 sports enthusiasts.
        </p>
        <img src="/assets/images/icons/avatars.png" alt="" />
      </div>
    </div>
  );
}
