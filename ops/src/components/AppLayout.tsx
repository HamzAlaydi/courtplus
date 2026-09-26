import { Avatar, Dropdown, Layout, Menu, Space, Typography } from "antd";
import {
  AuditOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  LogoutOutlined,
  ShopOutlined,
  BankOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import NotificationsBell from "@/components/NotificationsBell";
import { LIME } from "@/theme";

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

  const selectedKey =
    MENU_ITEMS.map((i) => i.key)
      .filter((k) => (k === "/" ? location.pathname === "/" : location.pathname.startsWith(k)))
      .sort((a, b) => b.length - a.length)[0] ?? "/";

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Admin";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={232} theme="dark">
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: LIME,
              color: "#0a1517",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
            }}
          >
            C+
          </div>
          <div>
            <Typography.Text strong style={{ color: "#fff", fontSize: 15, display: "block", lineHeight: 1.2 }}>
              Court+
            </Typography.Text>
            <Typography.Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
              Ops Console
            </Typography.Text>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 24px",
            gap: 16,
            borderBottom: "1px solid #eef0ea",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <NotificationsBell />
          <Dropdown
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
            <Space style={{ cursor: "pointer" }}>
              <Avatar style={{ background: "#0a1517" }}>
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
              <Typography.Text>{displayName}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
