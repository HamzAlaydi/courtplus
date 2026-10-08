import { Alert, Avatar, Button, Form, Input, Layout, Menu, Modal } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiArrowUpRight,
  FiCalendar,
  FiChevronsLeft,
  FiChevronsRight,
  FiCreditCard,
  FiGrid,
  FiHome,
  FiLifeBuoy,
  FiMapPin,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { Link, Outlet, useLocation } from "react-router-dom";
import LangSwitch from "./LangSwitch";
import NavBreadcrumb from "./NavBreadcrumb";
import NavDropdown from "./NavDropdown";
import NotificationsDropdown from "./NotificationsDropdown";
import { getTenant, requestUnsuspend } from "../../actions/tenant_action";
import { useNotification } from "../../modules/NotificationProvider";
import { notifyError } from "../../utils/errorMessages";

const { Header, Content, Sider } = Layout;

// Define the sidebar items along with the route patterns they should match
const sidebarRoutes = [
  { key: "1", path: "/home" },
  { key: "2", path: "/branches" },
  { key: "3", path: "/courts" },
  { key: "billing", path: "/billing" },
  { key: "schedule", path: "/schedule" },
  { key: "team", path: "/team" },
  { key: "users", path: "/users" },
  // { key: "sub1", path: "/users" },
  // { key: "sub2", path: "/teams" },
  // { key: "9", path: "/files" },
];

// Same role labels as the Team page
const ROLE_LABEL_KEYS = {
  Owner: "staff.owner",
  Admin: "staff.role_admin",
  User: "staff.role_user",
  SuperAdmin: "staff.role_superadmin",
};

const SIDER_WIDTH = 248;
const SIDER_COLLAPSED_WIDTH = 80;

// Start expanded on wide screens (as in the design), collapsed where the
// full sidebar would squeeze the content.
const startCollapsed = () =>
  typeof window === "undefined" || window.innerWidth < 1200;

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const DashboardLayout = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";
  const [collapsed, setCollapsed] = useState(startCollapsed);
  const location = useLocation();
  const notify = useNotification();
  const queryClient = useQueryClient();
  const [unsuspendModalOpen, setUnsuspendModalOpen] = useState(false);
  const [unsuspendForm] = Form.useForm();

  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: getTenant,
  });

  const unsuspendMutation = useMutation({
    mutationFn: (message) => requestUnsuspend(message),
    onSuccess: () => {
      setUnsuspendModalOpen(false);
      unsuspendForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      notify("success", t("suspension.sent"));
    },
    onError: (err) => {
      notifyError(notify, err, t, "suspension.send_failed");
    },
  });

  // Find the best matching key by selecting the one whose path is a prefix of the current location
  const getSelectedKey = () => {
    // Filter the sidebar routes where location.pathname starts with the route path.
    // Then select the one with the longest matching path (most specific)
    const matching = sidebarRoutes.filter((route) =>
      location.pathname.startsWith(route.path),
    );
    if (matching.length > 0) {
      // Sort by length of the path, descending
      matching.sort((a, b) => b.path.length - a.path.length);
      return matching[0].key;
    }
    // "/" renders Home; pages outside the sidebar (e.g. /settings) select nothing
    return location.pathname === "/" ? "1" : null;
  };

  const selectedKey = getSelectedKey();
  const iconStyle = { fontSize: "18px" };

  let storedUser;
  try {
    storedUser = JSON.parse(localStorage.getItem("userData") || "null");
  } catch {
    storedUser = undefined;
  }
  const staffRole = storedUser?.role;
  const canSeeBilling = !staffRole || staffRole === "Owner";
  // Staff management (list, invite, change role, unassign) is Owner-only on
  // the backend too, so managers would only get 403s from the Team page.
  // This is a hint from localStorage; the page re-checks against /staff/me.
  const canSeeTeam = !staffRole || staffRole === "Owner";

  // Define sidebar items (with submenus)
  const items = [
    {
      key: "1",
      icon: <FiHome style={iconStyle} />,
      label: <Link to="/home">{t("sideNav.home")}</Link>,
    },
    {
      key: "users",
      icon: <FiUser style={iconStyle} />,
      label: <Link to="/users">{t("sideNav.users")}</Link>,
    },
    {
      key: "2",
      icon: <FiMapPin style={iconStyle} />,
      label: <Link to="/branches">{t("sideNav.branches")}</Link>,
    },
    {
      key: "3",
      icon: <FiGrid style={iconStyle} />,
      label: <Link to="/courts">{t("sideNav.courts")}</Link>,
    },
    {
      key: "schedule",
      icon: <FiCalendar style={iconStyle} />,
      label: <Link to="/schedule">{t("sideNav.schedule")}</Link>,
    },
    ...(canSeeTeam
      ? [
          {
            key: "team",
            icon: <FiUsers style={iconStyle} />,
            label: <Link to="/team">{t("sideNav.team")}</Link>,
          },
        ]
      : []),
    // Billing endpoints are Owner-only; showing the entry to managers only
    // produced 403s.
    ...(canSeeBilling
      ? [
          {
            key: "billing",
            icon: <FiCreditCard style={iconStyle} />,
            label: <Link to="/billing">{t("sideNav.billing")}</Link>,
          },
        ]
      : []),

    // {
    //   key: "sub1",
    //   icon: <UserOutlined />,
    //   label: "User",
    //   children: [
    //     { key: "355", label: <Link to="/users/tom">Tom</Link> },
    //     { key: "4", label: <Link to="/users/bill">Bill</Link> },
    //     { key: "5", label: <Link to="/users/alex">Alex</Link> },
    //   ],
    // },
    // {
    //   key: "sub2",
    //   icon: <TeamOutlined />,
    //   label: "Team",
    //   children: [
    //     { key: "6", label: <Link to="/teams/team1">Team 1</Link> },
    //     { key: "8", label: <Link to="/teams/team2">Team 2</Link> },
    //   ],
    // },
    // {
    //   key: "9",
    //   icon: <FileOutlined />,
    //   label: <Link to="/files">Files</Link>,
    // },
  ];

  const userName = [storedUser?.firstName, storedUser?.lastName]
    .filter(Boolean)
    .join(" ");
  const tenantTitle = tenant?.name || userName || storedUser?.email || "";
  const roleLabel = ROLE_LABEL_KEYS[staffRole]
    ? t(ROLE_LABEL_KEYS[staffRole])
    : staffRole;
  const tenantMeta = [tenant?.name ? userName : null, roleLabel]
    .filter(Boolean)
    .join(" · ");
  const ExpandIcon = collapsed !== isRTL ? FiChevronsRight : FiChevronsLeft;

  return (
    <Layout className="dashboard-layout">
      <Sider
        className={`sidebar${collapsed ? " is-collapsed" : ""}`}
        width={SIDER_WIDTH}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={null} // Disable default collapse button
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div
              className="logo-container"
              dir="ltr"
              role="img"
              aria-label="Court+"
            >
              <span className="logo-word">{collapsed ? "c" : "court"}</span>
              <span className="logo-plus">+</span>
            </div>
            <Button
              type="text"
              onClick={() => setCollapsed(!collapsed)}
              className="btn-collapse"
              aria-expanded={!collapsed}
              aria-label={t("nav.toggle_sidebar")}
              icon={<ExpandIcon />}
            />
          </div>

          <Menu
            theme="dark"
            selectedKeys={selectedKey ? [selectedKey] : []}
            mode="inline"
            inlineIndent={12}
            items={items}
          />
        </div>

        <div className="sidebar-bottom">
          <Link
            className="btn-msg"
            to="https://website.courtplusapp.com/contact-us"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="btn-msg-icon">
              <FiLifeBuoy />
            </span>
            {!collapsed && (
              <div className="btn-msg-text">
                <h6>Need help?</h6>
                <span>Please contact us &rarr;</span>
              </div>
            )}
            {!collapsed && <FiArrowUpRight className="btn-msg-arrow" />}
          </Link>

          {tenantTitle && (
            <div className="sidebar-tenant" title={tenantTitle}>
              <Avatar
                size={38}
                className="sidebar-tenant-avatar"
                src={tenant?.logoURL || undefined}
              >
                {getInitials(tenantTitle)}
              </Avatar>
              {!collapsed && (
                <span className="sidebar-tenant-text">
                  <span className="sidebar-tenant-name">{tenantTitle}</span>
                  {tenantMeta && (
                    <span className="sidebar-tenant-meta">{tenantMeta}</span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </Sider>

      <Layout className="dashboard-main">
        <Header className="navbar">
          <NavBreadcrumb />
          <div className="navbar-btns">
            <LangSwitch />
            {/* <Badge dot={true}>
              <IoMdNotificationsOutline size={20} />
            </Badge> */}
            <NotificationsDropdown />
            <NavDropdown />
          </div>
        </Header>
        <Content className="content-container">
          {tenant?.blockedAt && (
            <Alert
              type="error"
              showIcon
              className="suspension-banner"
              message={t("suspension.banner_title")}
              description={tenant.blockedReason || undefined}
              action={
                <Button
                  danger
                  size="small"
                  onClick={() => setUnsuspendModalOpen(true)}
                >
                  {t("suspension.request_unsuspend")}
                </Button>
              }
            />
          )}
          <Outlet />
        </Content>
      </Layout>

      <Modal
        open={unsuspendModalOpen}
        title={t("suspension.modal_title")}
        onCancel={() => setUnsuspendModalOpen(false)}
        footer={null}
      >
        <Form
          form={unsuspendForm}
          layout="vertical"
          onFinish={(values) => unsuspendMutation.mutate(values.message)}
        >
          <Form.Item
            name="message"
            label={t("suspension.message_label")}
            rules={[{ required: true, max: 1000 }]}
          >
            <Input.TextArea
              rows={4}
              placeholder={t("suspension.message_placeholder")}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={unsuspendMutation.isPending}
            block
          >
            {t("suspension.send")}
          </Button>
        </Form>
      </Modal>
    </Layout>
  );
};

export default DashboardLayout;
