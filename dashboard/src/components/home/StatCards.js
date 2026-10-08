import React from "react";
import { useTranslation } from "react-i18next";
import useCountUp from "./useCountUp";

const StatCard = ({ label, value, suffix, variant }) => {
  const animatedValue = useCountUp(value);

  return (
    <div className={`cp-kpi${variant ? ` cp-kpi--${variant}` : ""}`}>
      <span className="cp-kpi__label">{label}</span>
      <span className="cp-kpi__value">
        {animatedValue.toLocaleString()}
        {suffix && <span className="cp-kpi__unit">{suffix}</span>}
      </span>
    </div>
  );
};

export default function StatCards({ stats, tenant }) {
  const { t } = useTranslation();

  const cards = [
    {
      id: "revenue",
      label: t("home.stats.totalRevenue"),
      value: stats?.totalRevenue ?? 0,
      suffix: t("home.currency"),
      variant: "ink",
    },
    {
      id: "bookings",
      label: t("home.stats.totalBookings"),
      value: stats?.totalBookings ?? 0,
    },
    {
      id: "upcoming",
      label: t("home.stats.upcomingBookings"),
      value: stats?.upcomingBookings ?? 0,
    },
    {
      id: "courts",
      label: t("home.stats.totalCourts"),
      value: tenant?.totalCourts ?? 0,
    },
  ];

  return (
    <div className="cp-kpi-grid cp-stagger">
      {cards.map(({ id, ...card }) => (
        <StatCard key={id} {...card} />
      ))}
    </div>
  );
}
