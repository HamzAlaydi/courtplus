import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Tag } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function WelcomeHeader({ staff, tenant }) {
  const { t, i18n } = useTranslation();

  const name = staff?.firstName || tenant?.name || "";
  const status = tenant?.blockedAt
    ? "blocked"
    : tenant?.name
    ? "published"
    : "unpublished";
  const statusColor =
    status === "published" ? "green" : status === "blocked" ? "red" : "orange";

  const today = new Date().toLocaleDateString(i18n.language, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="cp-page-head home-welcome">
      <div className="home-welcome-text">
        <h2 className="cp-page-title">{t("home.greeting", { name })}</h2>
        <p className="cp-page-subtitle">
          <span className="home-welcome-date">{today}</span>
          <span aria-hidden="true"> · </span>
          {t("home.subtitle")}
        </p>
      </div>
      <div className="home-welcome-actions">
        <Tag color={statusColor} className="home-welcome-status">
          {t(`home.${status}`)}
        </Tag>
        <Link to="/courts/add" tabIndex={-1}>
          <Button type="primary" icon={<PlusOutlined />}>
            {t("home.quickActions.addCourt")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
