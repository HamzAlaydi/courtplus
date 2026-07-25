import React, { useState } from "react";
import { Form, Input, Button } from "antd";
import { signUpStaff } from "../actions/auth_actions";
import { useNotification } from "../modules/NotificationProvider";
import { notifyError } from "../utils/errorMessages";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SignUpForm = () => {
  const [loading, setLoading] = useState(false);
  const notify = useNotification(); // Access global notification function
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  const { t } = useTranslation();

  const onFinish = (values) => {
    setLoading(true);
    signUpStaff(values)
      .then((res) => {
        console.log(res);
        navigate(`/auth/verification?email=${values.email}`);
      })
      .catch((err) => {
        console.log(err);
        notifyError(notify, err, t);
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
          <h2>Sign Up</h2>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item label="First Name" name="firstName" required>
              <Input placeholder="Enter the court license number" />
            </Form.Item>

            <Form.Item label="Last Name" name="lastName" required>
              <Input placeholder="Enter the full name" />
            </Form.Item>

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

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter your password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
              hasFeedback
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
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
              <Input.Password placeholder="Confirm password" />
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

export default SignUpForm;
