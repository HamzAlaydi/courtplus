import React, { useState } from "react";
import { Form, Input, Button } from "antd";
import { signInStaff } from "../actions/auth_actions";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useNotification } from "../modules/NotificationProvider";

const SignInForm = () => {
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const data = await dispatch(signInStaff(values)); // Ensure the function properly throws an error
      console.log("Sign-in response data:", data); // Debugging line
      if (data === "INVALID_CREDENTIALS") {
        notify("error", "Invalid username or password"); // Display the notification
      }
    } catch (error) {
      console.log("Error during sign-in:", error);
      notify("error", "Invalid username or password"); // Display the notification
    } finally {
      setLoading(false); // Stop the loading state
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-form-container">
        <div className="auth-form-header">
          <img src="/assets/images/logo-horizontal.png" alt="" />
          <img src="/assets/images/icons/auth-key.png" alt="" />
        </div>
        <div className="auth-form">
          <h2>Sign In</h2>
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

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: "Please enter your password" },
              ]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            <Form.Item>
              <Button
                style={{ color: "#000" }}
                type="primary"
                htmlType="submit"
                block
                loading={loading}
              >
                {loading ? "Loading..." : "Sign In"}
              </Button>
            </Form.Item>
            <h6>
              <Link to="/auth/forget-password">Forgot Password?</Link>
            </h6>
          </Form>
        </div>
        <h5>
          Do not have an account?{" "}
          <Link className="active" to="/auth/signup">
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

export default SignInForm;
