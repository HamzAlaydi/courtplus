"use client";
import {
  CheckOutlined,
  RightOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Progress, Tabs, Form, Input, Button, Card, Empty, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Users from "./Users";
import { getMe, updateMe } from "../actions/staff.action";
import { getTenant } from "../actions/tenant_action";
import { getBranches } from "../actions/branch_action";
import { getTenantStats } from "../actions/stats_action";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const { data: staff } = useQuery({
    queryKey: ["staff-me"],
    queryFn: getMe,
  });

  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: getTenant,
  });

  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(),
  });

  const { data: stats } = useQuery({
    queryKey: ["tenant-stats"],
    queryFn: () => getTenantStats(),
  });

  useEffect(() => {
    if (staff) {
      form.setFieldsValue({
        firstName: staff.firstName,
        lastName: staff.lastName,
      });
    }
  }, [staff, form]);

  const updateMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      message.success(t("home.profileSaved"));
      queryClient.invalidateQueries({ queryKey: ["staff-me"] });
    },
    onError: (err) => {
      message.error(err?.response?.data?.message || t("home.profileSaveError"));
    },
  });

  const handleSave = (values) => {
    updateMutation.mutate({
      firstName: values.firstName,
      lastName: values.lastName,
    });
  };

  // ✅ Profile completion comes from the tenant profileCompletion flags
  const completion = tenant?.profileCompletion || {};
  const checkItems = [
    { id: "basicDetails", label: t("home.basicDetails"), checked: !!completion.name },
    { id: "essential", label: t("home.essential"), checked: !!completion.phoneNumber },
    { id: "entityRoles", label: t("home.entityRoles"), checked: !!completion.logo },
    { id: "branches", label: t("home.branches"), checked: !!completion.branches },
    { id: "court", label: t("home.court"), checked: !!completion.courts },
  ];
  const completedCount = checkItems.filter((item) => item.checked).length;
  const percent = Math.round((completedCount / checkItems.length) * 100);

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString(i18n.language) : "—";

  const statusLabel = tenant?.blockedAt
    ? t("home.blocked")
    : percent === 100
    ? t("home.published")
    : t("home.unpublished");

  const branches = branchesData?.items || [];

  const tabs = [
    {
      key: "1",
      label: t("home.essentialTab"),
      children: (
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="firstName" label={t("home.firstName")}>
            <Input
              placeholder={t("home.firstNamePlaceholder")}
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item name="lastName" label={t("home.lastName")}>
            <Input
              placeholder={t("home.lastNamePlaceholder")}
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item label={t("home.email")}>
            <Input value={staff?.email} prefix={<MailOutlined />} disabled />
          </Form.Item>
          <Form.Item label={t("home.phone")}>
            <Input
              value={staff?.phoneNumber}
              prefix={<PhoneOutlined />}
              disabled
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateMutation.isPending}
            >
              {t("home.save")}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "2",
      label: t("home.detailsTab"),
      children: (
        <>
          <p>{t("home.detailsContent")}</p>
          <Card title={t("home.tenantInfo")} style={{ marginTop: "1rem" }}>
            <p>
              {t("home.name")}: {tenant?.name || "—"}
            </p>
            <p>
              {t("home.phone")}: {tenant?.phoneNumber || "—"}
            </p>
          </Card>
          <Card title={t("home.stats")} style={{ marginTop: "1rem" }}>
            <p>
              {t("home.totalRevenue")}:{" "}
              {stats?.totalRevenue?.toLocaleString() ?? 0} SAR
            </p>
            <p>
              {t("home.totalBookings")}: {stats?.totalBookings ?? 0}
            </p>
            <p>
              {t("home.upcomingBookings")}: {stats?.upcomingBookings ?? 0}
            </p>
          </Card>
          <Card title={t("home.branches")} style={{ marginTop: "1rem" }}>
            {branches.length > 0 ? (
              branches.map((branch) => (
                <p key={branch.id}>
                  {branch.name}
                  {branch.location?.address
                    ? ` — ${branch.location.address}`
                    : ""}
                </p>
              ))
            ) : (
              <Empty description={t("home.noBranches")} />
            )}
          </Card>
        </>
      ),
    },
    {
      key: "3",
      label: t("home.entityRolesTab"),
      children: <Users />,
    },
  ];

  const toggleItems = () => setIsOpen((prev) => !prev);

  return (
    <div className={`home ${isRTL ? "rtl" : ""}`}>
      <div className="home-header">
        <div className="home-header-left">
          <div className="acc-info">
            <div className="acc-info-item">
              <p>{t("home.status")}</p>
              <h5>• {statusLabel}</h5>
            </div>
            <div className="acc-info-item">
              <p>{t("home.created")}</p>
              <h5>• {formatDate(tenant?.createdAt)}</h5>
            </div>
            <div className="acc-info-item">
              <p>{t("home.updated")}</p>
              <h5>• {formatDate(tenant?.updatedAt)}</h5>
            </div>
          </div>

          <h2>{t("home.title")}</h2>
          <p>{t("home.description")}</p>
        </div>

        <div className="acc-header-right">
          <div className="acc-card">
            <div className="acc-card-top">
              <Progress
                strokeColor="#c0ff42"
                size="small"
                type="circle"
                percent={percent}
                format={() => t("home.done")}
              />
              <div className="acc-card-header">
                <div className="acc-card-precentage">
                  <h4>{percent}%</h4>
                  <button onClick={toggleItems} aria-label="Toggle checklist">
                    <RightOutlined />
                  </button>
                </div>
                <p>{t("home.profileProgress")}</p>
              </div>
            </div>

            <ul className={`check-items ${isOpen ? "visible" : ""}`}>
              {checkItems.map((item) => (
                <li key={item.id}>
                  <span className={`check ${item.checked ? "checked" : ""}`}>
                    {item.checked && <CheckOutlined />}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <hr />
      <Tabs defaultActiveKey="1" items={tabs} />
    </div>
  );
}
