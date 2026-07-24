import React from "react";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

export default function WelcomeHeader({ staff, tenant }) {
  const { t } = useTranslation();

  const name = staff?.firstName || tenant?.name || "";
  const status = tenant?.blockedAt
    ? "blocked"
    : tenant?.name
    ? "published"
    : "unpublished";
  const statusColor =
    status === "published" ? "green" : status === "blocked" ? "red" : "orange";

  return (
    <div className="home-welcome">
      <div>
        <h2>{t("home.greeting", { name })}</h2>
        <p>{t("home.subtitle")}</p>
      </div>
      <Tag color={statusColor} className="home-welcome-status">
        {t(`home.${status}`)}
      </Tag>
    </div>
  );
}
