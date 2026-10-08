import { useState } from "react";
import { Alert, Button, Form, Input } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { apiErrorMessage } from "@/api/client";
import BrandMark from "@/components/BrandMark";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setError(null);
    setLoading(true);
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error && !("isAxiosError" in err)
          ? err.message
          : apiErrorMessage(err, "Login failed. Check your credentials."),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ops-auth">
      <BrandMark size="lg" />
      <main className="ops-auth__card">
        <div className="ops-auth__intro">
          <h1 className="ops-auth__title">Court+ Ops Console</h1>
          <span className="ops-auth__subtitle">Sign in with an operations admin account</span>
        </div>

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 20 }} />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="ops@courtplusapp.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Password is required" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            className="ops-auth__submit ops-cta"
          >
            Sign in
          </Button>
        </Form>
      </main>
    </div>
  );
}
