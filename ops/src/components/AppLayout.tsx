import { useState } from "react";
import { Avatar, Drawer, Dropdown, Grid, Layout, Menu } from "antd";
import {
  AuditOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuOutlined,
  ShopOutlined,
  BankOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useAuth } from "@/auth/AuthContext";
import BrandMark from "@/components/BrandMark";
import NotificationsBell from "@/components/NotificationsBell";

const { Sider, Header, Content } = Layout;

const MENU_ITEMS = [
  { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/approvals", icon: <CheckSquareOutlined />, label: "Court Approvals" },
  { key: "/vendors", icon: <ShopOutlined />, label: "Vendors" },
  { key: "/logs", icon: <AuditOutlined />, label: "Activity Log" },
  { key: "/payouts", icon: <BankOutlined />, label: "Payouts" },
  { key: "/admins", icon: <TeamOutlined />, label: "Admins" },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const screens = Grid.useBreakpoint();
  const compact = screens.lg === false;
  const [navOpen, setNavOpen] = useState(false);

  const selectedKey =
    MENU_ITEMS.map((i) => i.key)
      .filter((k) => (k === "/" ? location.pathname === "/" : location.pathname.startsWith(k)))
      .sort((a, b) => b.length - a.length)[0] ?? "/";

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Admin";

  const navigation = (
    <div className="ops-sider__inner">
      <BrandMark />
      <Menu
        className="ops-nav"
        theme="dark"
        mode="inline"
        inlineIndent={12}
        selectedKeys={[selectedKey]}
        items={MENU_ITEMS}
        onClick={({ key }) => {
          setNavOpen(false);
          navigate(key);
        }}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {compact ? (
        <Drawer
          open={navOpen}
          onClose={() => setNavOpen(false)}
          placement="left"
          width={272}
          closable={false}
          rootClassName="ops-nav-drawer"
          styles={{ body: { padding: 0 } }}
        >
          {navigation}
        </Drawer>
      ) : (
        <Sider width={248} theme="dark" className="ops-sider">
          {navigation}
        </Sider>
      )}
      <Layout>
        <Header className="ops-topbar">
          <div className="ops-topbar__start">
            {compact ? (
              <>
                <button
                  type="button"
                  className="ops-icon-btn"
                  aria-label="Open menu"
                  aria-expanded={navOpen}
                  onClick={() => setNavOpen(true)}
                >
                  <MenuOutlined />
                </button>
                <BrandMark tone="light" size="sm" />
              </>
            ) : (
              <span className="ops-topbar__date">{dayjs().format("dddd, D MMMM YYYY")}</span>
            )}
          </div>
          <div className="ops-topbar__actions">
            <NotificationsBell />
            <Dropdown
              placement="bottomRight"
              menu={{
                items: [{ key: "logout", icon: <LogoutOutlined />, label: "Log out" }],
                onClick: ({ key }) => {
                  if (key === "logout") {
                    logout();
                    navigate("/login");
                  }
                },
              }}
            >
              <button type="button" className="ops-user">
                <Avatar size={34} className="ops-user__avatar">
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
                <span className="ops-user__name">{displayName}</span>
                <DownOutlined className="ops-user__caret" />
              </button>
            </Dropdown>
          </div>
        </Header>
        <Content className="ops-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
