import {
  DownOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Spin, Modal, Button, Descriptions } from "antd";
import { useDispatch } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { logout } from "../../context/auth";
import { getMe } from "../../actions/staff.action";
import { useNavigate } from "react-router-dom";

const NavDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const { isLoading, data: user } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    keepPreviousData: true,
  });

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setIsModalVisible(false);
  };

  const openProfileModal = () => setIsModalVisible(true);
  const closeProfileModal = () => setIsModalVisible(false);

  if (isLoading) return <Spin />;

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  const items = [
    {
      label: <span onClick={openProfileModal}>{t("nav.profile")}</span>,
      key: "profile",
    },
    {
      label: (
        <span onClick={() => navigate("/settings")}>{t("nav.settings")}</span>
      ),
      key: "settings",
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
            <span className="nav-name">
              {user?.firstName} {user?.lastName}
            </span>
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
          <Button key="logout" type="primary" danger onClick={handleLogout}>
            {t("nav.logout")}
          </Button>,
        ]}
        className={`profile-modal ${isRTL ? "rtl" : ""}`}
      >
        <div className="profile-header">
          <Avatar size={100} className="profile-avatar">
            {initials}
          </Avatar>
          <h3>
            {user?.firstName} {user?.lastName}
          </h3>
          <p className="profile-role">{user?.role}</p>
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
          <Descriptions.Item label={t("nav.created")}>
            {new Date(user?.createdAt).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label={t("nav.verified")}>
            {user?.verifiedAt
              ? new Date(user.verifiedAt).toLocaleDateString()
              : t("nav.notVerified")}
          </Descriptions.Item>
          <Descriptions.Item label={t("nav.tenantId")}>
            {user?.tenantId}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
};

export default NavDropdown;
