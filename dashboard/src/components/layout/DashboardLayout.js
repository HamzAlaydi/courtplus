import { FieldTimeOutlined, PieChartOutlined } from "@ant-design/icons";
import { Button, Layout, Menu } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { FiGrid, FiMapPin, FiUsers } from "react-icons/fi";
import { Link, Outlet, useLocation } from "react-router-dom";
import LangSwitch from "./LangSwitch";
import NavBreadcrumb from "./NavBreadcrumb";
import NavDropdown from "./NavDropdown";
import NotificationsDropdown from "./NotificationsDropdown";

const { Header, Content, Sider } = Layout;

// Define the sidebar items along with the route patterns they should match
const sidebarRoutes = [
  { key: "1", path: "/home" },
  { key: "2", path: "/branches" },
  { key: "3", path: "/courts" },
  { key: "schedule", path: "/schedule" },
  { key: "users", path: "/users" },
  // { key: "sub1", path: "/users" },
  // { key: "sub2", path: "/teams" },
  // { key: "9", path: "/files" },
];

const DashboardLayout = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

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
    return "1";
  };

  const selectedKey = getSelectedKey();
  const iconStyle = { fontSize: "18px" };

  // Define sidebar items (with submenus)
  const items = [
    {
      key: "1",
      icon: <PieChartOutlined />,
      label: <Link to="/home">{t("sideNav.home")}</Link>,
    },
    {
      key: "users",
      icon: <FiUsers style={iconStyle} />,
      label: <Link to="/users">{t("sideNav.users")}</Link>,
    },
    {
      key: "2",
      icon: <FiGrid style={iconStyle} />,
      label: <Link to="/branches">{t("sideNav.branches")}</Link>,
    },
    {
      key: "3",
      icon: <FiMapPin style={iconStyle} />,
      label: <Link to="/courts">{t("sideNav.courts")}</Link>,
    },
    {
      key: "schedule",
      icon: <FieldTimeOutlined style={iconStyle} />,
      label: <Link to="/schedule">{t("sideNav.schedule")}</Link>,
    },

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

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider
        className="sidebar"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={null} // Disable default collapse button
      >
        <div>
          <div className="logo-container">
            <img src="/assets/images/logo.png" alt="" />
            {!collapsed && (
              <>
                <img src="/assets/images/court.png" alt="" />
                <img src="/assets/images/plus.png" alt="" />
              </>
            )}
          </div>
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            className="btn-collapse"
          >
            {collapsed ? (
              <FaAngleRight color="#fff" />
            ) : (
              <FaAngleLeft color="#fff" />
            )}
          </Button>

          <Menu
            theme="dark"
            selectedKeys={[selectedKey]}
            mode="inline"
            items={items}
          />
        </div>

        <Link
          className="btn-msg"
          to="https://website.courtplusapp.com/contact-us"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="assets/images/icons/msg-icon.png" alt="" />
          {!collapsed && (
            <div>
              <h6>Need help?</h6>
              <span>Please contact us &rarr;</span>
            </div>
          )}
        </Link>
      </Sider>

      <Layout>
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
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
