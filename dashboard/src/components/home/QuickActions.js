import React from "react";
import {
  CalendarOutlined,
  PlusOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function QuickActions() {
  const { t } = useTranslation();

  return (
    <section className="cp-card home-card home-quick-actions">
      <div className="cp-section-head">
        <h3 className="cp-section-title">{t("home.quickActions.title")}</h3>
      </div>
      <div className="home-quick-actions-list">
        <Link to="/branches/add" tabIndex={-1}>
          <Button type="primary" size="large" icon={<PlusOutlined />} block>
            {t("home.quickActions.addBranch")}
          </Button>
        </Link>
        <Link to="/courts/add" tabIndex={-1}>
          <Button size="large" icon={<ShopOutlined />} block>
            {t("home.quickActions.addCourt")}
          </Button>
        </Link>
        <Link to="/schedule" tabIndex={-1}>
          <Button size="large" icon={<CalendarOutlined />} block>
            {t("home.quickActions.viewSchedule")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
