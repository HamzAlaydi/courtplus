import { useState } from "react";
import { App, Button, Card, Col, Empty, Form, Input, Popconfirm, Progress, Row, Table } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { createAdmin, deactivateAdmin, listAdmins } from "@/api/ops";
import { apiErrorMessage } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import type { StaffUser } from "@/api/types";
import PageHeader from "@/components/PageHeader";
import StatusTag from "@/components/StatusTag";
import TableSkeleton from "@/components/TableSkeleton";
import { COLORS } from "@/theme";

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
    <div className="ops-page">
      <PageHeader title="Ops Admins" />

      <Card title="Create admin" styles={{ body: { paddingTop: 4, paddingBottom: 2 } }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(v: { firstName: string; lastName: string; email: string; password: string }) =>
            createMutation.mutate(v)
          }
        >
          <Row gutter={[12, 0]}>
            <Col xs={24} sm={12} xl={8}>
              <Form.Item name="firstName" rules={[{ required: true, message: "Required" }]}>
                <Input placeholder="First name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Form.Item name="lastName" rules={[{ required: true, message: "Required" }]}>
                <Input placeholder="Last name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Required" },
                  { type: "email", message: "Invalid email" },
                ]}
              >
                <Input placeholder="Email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Required" },
                  { min: 8, message: "Minimum 8 characters" },
                ]}
                extra={
                  password ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                      <Progress
                        percent={strength}
                        size="small"
                        showInfo={false}
                        strokeColor={
                          strength < 50
                            ? COLORS.danger
                            : strength < 75
                              ? COLORS.star
                              : COLORS.success
                        }
                        trailColor={COLORS.divider}
                        style={{ flex: 1, margin: 0 }}
                      />
                      <span className="ops-muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        Strength: {STRENGTH_LABEL[Math.min(4, Math.floor(strength / 20))]}
                      </span>
                    </span>
                  ) : undefined
                }
              >
                <Input.Password
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={8}>
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
                <Input.Password placeholder="Confirm password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} xl={8}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<UserAddOutlined />}
                  loading={createMutation.isPending}
                >
                  Create
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table<StaffUser>
        rowKey="id"
        dataSource={activeAdmins}
        scroll={{ x: true }}
        locale={{
          emptyText: isLoading ? (
            <TableSkeleton rows={3} />
          ) : (
            <Empty className="ops-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ),
        }}
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
            render: (_, a) => {
              const name = [a.firstName, a.lastName].filter(Boolean).join(" ");
              return (
                <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
                  <span className="ops-list__avatar" aria-hidden="true">
                    {(name || a.email).charAt(0).toUpperCase()}
                  </span>
                  <span style={{ fontWeight: 600 }}>{name || "—"}</span>
                  {a.id === user?.id && <StatusTag status="you" tone="feature" size="sm" />}
                </span>
              );
            },
          },
          {
            title: "Email",
            dataIndex: "email",
            render: (email: string) => <span style={{ overflowWrap: "anywhere" }}>{email}</span>,
          },
          {
            title: "Role",
            dataIndex: "role",
            width: 130,
            render: (role: string) => <StatusTag status={role} tone="ink" />,
          },
          {
            title: "Created",
            dataIndex: "createdAt",
            width: 140,
            render: (d: string) => (
              <span className="ops-muted" style={{ whiteSpace: "nowrap" }}>
                {dayjs(d).format("MMM D, YYYY")}
              </span>
            ),
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
    </div>
  );
}
