import { Form, Button, Input } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { verifyStaff } from "../actions/auth_actions";
import { useNotification } from "../modules/NotificationProvider";

export default function OtpForm() {
  const notify = useNotification();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState();
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

  const onFinish = (values) => {
    setLoading(true);
    const formData = {
      code: values.code,
      email: email,
      context: "account_verification",
    };
    console.log(formData);

    verifyStaff(formData)
      .then((res) => {
        console.log(res);
        notify("success", "Success!!");
        navigate("/auth/signin");
      })
      .catch((err) => {
        console.log(err);
        notify("error", err);
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
        <h2>Input OTP for Account to Sign up</h2>

        <div className="auth-form">
          <p style={{ marginBottom: "2rem" }}>
            Court+ just sent you a 8-Digit Code to <strong>{email}</strong>{" "}
            please check your Email & enter the code below.
          </p>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item name="code">
              <Input.OTP size="large" length={6} />
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
          Have an account?
          <Link className="active" to="/auth/signin ">
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
}
