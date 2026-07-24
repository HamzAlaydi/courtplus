import React from "react";
import {
  CalendarOutlined,
  FieldTimeOutlined,
  MoneyCollectOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import useCountUp from "./useCountUp";

const StatCard = ({ icon, label, value, suffix }) => {
  const animatedValue = useCountUp(value);

  return (
    <div className="home-stat-card">
      <div className="home-stat-icon">{icon}</div>
      <div className="home-stat-body">
        <span className="home-stat-label">{label}</span>
        <h3 className="home-stat-value">
          {animatedValue.toLocaleString()}
          {suffix && <small> {suffix}</small>}
        </h3>
      </div>
    </div>
  );
};

export default function StatCards({ stats, tenant }) {
  const { t } = useTranslation();

  const cards = [
    {
      id: "revenue",
      icon: <MoneyCollectOutlined />,
      label: t("home.stats.totalRevenue"),
      value: stats?.totalRevenue ?? 0,
      suffix: t("home.currency"),
    },
    {
      id: "bookings",
      icon: <CalendarOutlined />,
      label: t("home.stats.totalBookings"),
      value: stats?.totalBookings ?? 0,
    },
    {
      id: "upcoming",
      icon: <FieldTimeOutlined />,
      label: t("home.stats.upcomingBookings"),
      value: stats?.upcomingBookings ?? 0,
    },
    {
      id: "courts",
      icon: <TrophyOutlined />,
      label: t("home.stats.totalCourts"),
      value: tenant?.totalCourts ?? 0,
    },
  ];

  return (
    <div className="home-stats">
      {cards.map((card) => (
        <StatCard key={card.id} {...card} />
      ))}
    </div>
  );
}
