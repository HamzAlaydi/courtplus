import { useState } from "react";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Progress,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { createAdmin, deactivateAdmin, listAdmins } from "@/api/ops";
import { apiErrorMessage } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import type { StaffUser } from "@/api/types";

/** Rough password-strength score 0–100 for the hint meter. */
function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 30;
  if (pw.length >= 12) score += 20;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 20;
  if (/\d/.test(pw)) score += 15;
  if (/[^A-Za-z0-9]/.test(pw)) score += 15;
  return score;
}

const STRENGTH_LABEL = ["Very weak", "Weak", "Fair", "Good", "Strong"];

export default function AdminsPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [password, setPassword] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ops", "admins", { page, pageSize }],
    queryFn: () => listAdmins({ page, pageSize }),
  });

  const activeAdmins = data?.items ?? [];
  const strength = passwordStrength(password);

  const createMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: () => {
      message.success("Admin created");
      form.resetFields();
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["ops", "admins"] });
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to create admin")),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdmin,
    onSuccess: () => {
      message.success("Admin deactivated");
      queryClient.invalidateQueries({ queryKey: ["ops", "admins"] });
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to deactivate admin")),
  });

  const isLastAdmin = activeAdmins.length <= 1;

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Ops Admins
      </Typography.Title>

      <Card title="Create admin" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          style={{ rowGap: 12 }}
          onFinish={(v: {
            firstName: string;
            lastName: string;
            email: string;
            password: string;
          }) => createMutation.mutate(v)}
        >
          <Form.Item name="firstName" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="First name" />
          </Form.Item>
          <Form.Item name="lastName" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Last name" />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Required" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input placeholder="Email" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Required" },
              { min: 8, message: "Minimum 8 characters" },
            ]}
            extra={
              password ? (
                <Progress
                  percent={strength}
                  size="small"
                  showInfo={false}
                  strokeColor={strength < 50 ? "#ff4d4f" : strength < 75 ? "#faad14" : "#52c41a"}
                  style={{ width: 180, marginTop: 4 }}
                />
              ) : undefined
            }
          >
            <Input.Password
              placeholder="Password"
              style={{ width: 180 }}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
          <Form.Item
            name="confirm"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Confirm the password" },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || getFieldValue("password") === value
                    ? Promise.resolve()
                    : Promise.reject(new Error("Passwords do not match")),
              }),
            ]}
          >
            <Input.Password placeholder="Confirm password" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Create
            </Button>
          </Form.Item>
          {password && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Strength: {STRENGTH_LABEL[Math.min(4, Math.floor(strength / 20))]}
            </Typography.Text>
          )}
        </Form>
      </Card>

      <Table<StaffUser>
        rowKey="id"
        loading={isLoading}
        dataSource={activeAdmins}
        pagination={{
          current: page,
          pageSize,
          total: data?.pagination.totalCount,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        columns={[
          {
            title: "Name",
            render: (_, a) =>
              [a.firstName, a.lastName].filter(Boolean).join(" ") || "—",
          },
          {
            title: "Email",
            dataIndex: "email",
            render: (email: string, a) => (
              <>
                {email}{" "}
                {a.id === user?.id && <Tag color="blue">you</Tag>}
              </>
            ),
          },
          {
            title: "Role",
            dataIndex: "role",
            width: 130,
            render: (role: string) => <Tag color="geekblue">{role}</Tag>,
          },
          {
            title: "Created",
            dataIndex: "createdAt",
            width: 140,
            render: (d: string) => dayjs(d).format("MMM D, YYYY"),
          },
          {
            title: "Actions",
            width: 130,
            render: (_, a) => {
              const disabled = a.id === user?.id || isLastAdmin;
              const reason =
                a.id === user?.id
                  ? "You cannot deactivate yourself"
                  : isLastAdmin
                    ? "The last active admin cannot be deactivated"
                    : undefined;
              return (
                <Popconfirm
                  title={`Deactivate ${a.email}?`}
                  onConfirm={() => deactivateMutation.mutate(a.id)}
                  disabled={disabled}
                >
                  <Button size="small" danger disabled={disabled} title={reason}>
                    Deactivate
                  </Button>
                </Popconfirm>
              );
            },
          },
        ]}
      />
    </>
  );
}
