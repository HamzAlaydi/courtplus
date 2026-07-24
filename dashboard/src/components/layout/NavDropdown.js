import {
  DownOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Spin, Modal, Button, Descriptions, Tag } from "antd";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { logout } from "../../context/auth";
import { getMe } from "../../actions/staff.action";
import { getTenant } from "../../actions/tenant_action";
import { useNavigate } from "react-router-dom";

const NavDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const { isLoading, data: user } = useQuery({
    queryKey: ["staff-me"],
    queryFn: getMe,
  });

  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: getTenant,
  });

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setIsModalVisible(false);
  };

  const openProfileModal = () => setIsModalVisible(true);
  const closeProfileModal = () => setIsModalVisible(false);

  const handleEditProfile = () => {
    setIsModalVisible(false);
    navigate("/settings");
  };

  if (isLoading) return <Spin />;

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;
  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      "U"
    : "U";

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString(i18n.language) : t("nav.noPhone");

  const items = [
    {
      label: t("nav.profile"),
      key: "profile",
      onClick: openProfileModal,
    },
    {
      label: t("nav.settings"),
      key: "settings",
      onClick: () => navigate("/settings"),
    },
    { type: "divider" },
    {
      label: t("nav.logout"),
      key: "logout",
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <>
      <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
        <button className={`nav-prof-btn ${isRTL ? "rtl" : ""}`}>
          <Avatar size="large" className="nav-avatar">
            {initials}
          </Avatar>
          <div className="nav-user-info">
            <span className="nav-name">{fullName}</span>
            <small className="nav-role">{user?.role}</small>
          </div>
          <DownOutlined className="nav-down-icon" />
        </button>
      </Dropdown>

      <Modal
        title={t("nav.profile")}
        open={isModalVisible}
        onCancel={closeProfileModal}
        footer={[
          <Button key="close" onClick={closeProfileModal}>
            {t("nav.close")}
          </Button>,
          <Button key="edit" type="primary" onClick={handleEditProfile}>
            {t("nav.editProfile")}
          </Button>,
          <Button key="logout" danger onClick={handleLogout}>
            {t("nav.logout")}
          </Button>,
        ]}
        className={`profile-modal ${isRTL ? "rtl" : ""}`}
      >
        <div className="profile-header">
          <Avatar size={100} className="profile-avatar">
            {initials}
          </Avatar>
          <h3>{fullName}</h3>
          <Tag color="green" className="profile-role">
            {user?.role}
          </Tag>
        </div>

        <Descriptions
          bordered
          column={1}
          size="middle"
          layout={isRTL ? "vertical" : "horizontal"}
          className="profile-details"
        >
          <Descriptions.Item
            label={
              <>
                <MailOutlined /> {t("nav.email")}
              </>
            }
          >
            {user?.email}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <>
                <PhoneOutlined /> {t("nav.phone")}
              </>
            }
          >
            {user?.phoneNumber || t("nav.noPhone")}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <>
                <ShopOutlined /> {t("nav.tenant")}
              </>
            }
          >
            {tenant?.name || "—"}
          </Descriptions.Item>
          <Descriptions.Item label={t("nav.created")}>
            {formatDate(user?.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t("nav.verified")}>
            {user?.verifiedAt
              ? formatDate(user.verifiedAt)
              : t("nav.notVerified")}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
};

export default NavDropdown;
