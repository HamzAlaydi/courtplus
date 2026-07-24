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
    <div className="home-card home-quick-actions">
      <h4 className="home-card-title">{t("home.quickActions.title")}</h4>
      <Link to="/branches/add">
        <Button type="primary" icon={<PlusOutlined />} block>
          {t("home.quickActions.addBranch")}
        </Button>
      </Link>
      <Link to="/courts/add">
        <Button icon={<ShopOutlined />} block>
          {t("home.quickActions.addCourt")}
        </Button>
      </Link>
      <Link to="/schedule">
        <Button icon={<CalendarOutlined />} block>
          {t("home.quickActions.viewSchedule")}
        </Button>
      </Link>
    </div>
  );
}
