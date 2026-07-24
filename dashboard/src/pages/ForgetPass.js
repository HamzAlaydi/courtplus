import { useState } from "react";
import { Form, Input, Button } from "antd";
import { forgetPass } from "../actions/auth_actions";
import { useNotification } from "../modules/NotificationProvider";
import { Link, useNavigate } from "react-router-dom";

const ForgetPass = () => {
  const [loading, setLoading] = useState(false);
  const notify = useNotification(); // Access global notification function
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  const onFinish = (values) => {
    setLoading(true);
    forgetPass(values)
      .then((res) => {
        console.log(res);
        navigate(`/auth/reset-password?email=${values.email}`);
      })
      .catch((err) => {
        notify("error", err?.response?.data?.message);
      });
    setLoading(false);
  };

  return (
    <div className="auth-layout">
      <div className="auth-form-container">
        <div className="auth-form-header">
          <img src="/assets/images/logo-horizontal.png" alt="" />
          <img src="/assets/images/icons/auth-key.png" alt="" />
        </div>
        <div className="auth-form">
          <h2>Forget Password</h2>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                {
                  required: true,
                  type: "email",
                  message: "Please enter a valid email address!",
                },
              ]}
            >
              <Input placeholder="Enter the email address" />
            </Form.Item>

            <Form.Item>
              <Button
                style={{ color: "#000" }}
                type="primary"
                htmlType="submit"
                block
                loading={loading}
              >
                Reset Password
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
        <h1>Start swinging your racket into happiness.</h1>{" "}
        <p>
          Create a free account and get full access to hundred of courts around
          you. No credit card needed. Trusted by over 4,000 sports enthusiasts.
        </p>
        <img src="/assets/images/icons/avatars.png" alt="" />
      </div>
    </div>
  );
};

export default ForgetPass;
