import React from "react";
import { Empty, Table, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getBookings } from "../../actions/booking_action";

const STATUS_COLORS = {
  pending: "orange",
  in_progress: "blue",
  completed: "green",
  cancelled: "red",
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Amount is not stored on the booking — derived from rate × duration
const getAmount = (booking) =>
  ((booking.hourlyRate || 0) * (booking.duration || 0)) / 60;

const getCustomerName = (booking) => {
  const user = booking.participants?.[0]?.user;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return name || user?.username || "—";
};

export default function RecentReservations() {
  const { t, i18n } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["recent-bookings"],
    queryFn: () => getBookings({ page: 1, pageSize: 5 }),
    refetchInterval: 30000, // near-real-time updates
  });

  const bookings = data?.items || [];

  const columns = [
    {
      title: t("home.reservations.customer"),
      key: "customer",
      render: (_, record) => {
        const name = getCustomerName(record);
        return (
          <span
            className={`home-res-customer${name === "—" ? " is-empty" : ""}`}
          >
            {name}
          </span>
        );
      },
    },
    {
      title: t("home.reservations.court"),
      key: "court",
      render: (_, record) => (
        <span className="home-res-court" title={record.court?.name}>
          {record.court?.name || "—"}
        </span>
      ),
    },
    {
      title: t("home.reservations.date"),
      key: "date",
      render: (_, record) => (
        <span className="home-res-stack">
          <span>
            {new Date(record.startDate).toLocaleDateString(i18n.language, {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
          <span className="cp-caption cp-num">
            {`${formatTime(record.startDate)} – ${formatTime(record.endDate)}`}
          </span>
        </span>
      ),
    },
    {
      title: t("home.reservations.amount"),
      key: "amount",
      align: "end",
      render: (_, record) => (
        <span className="home-res-stack home-res-amount">
          <strong className="cp-num">
            {`${getAmount(record).toLocaleString()} ${(
              record.currency || ""
            ).toUpperCase()}`}
          </strong>
          <span className="cp-caption">
            {t("home.reservations.minutes", { count: record.duration })}
          </span>
        </span>
      ),
    },
    {
      title: t("home.reservations.status"),
      key: "status",
      render: (_, record) => (
        <Tag color={STATUS_COLORS[record.status] || "default"}>
          {t(`home.reservations.statuses.${record.status}`, record.status)}
        </Tag>
      ),
    },
  ];

  return (
    <section className="cp-card home-card home-reservations">
      <div className="cp-section-head">
        <h3 className="cp-section-title">{t("home.reservations.title")}</h3>
        <Link to="/schedule" className="cp-link">
          {t("home.branches.viewAll")}
        </Link>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={bookings}
        loading={isLoading}
        pagination={false}
        scroll={{ x: 520 }}
        locale={{
          emptyText: <Empty description={t("home.reservations.empty")} />,
        }}
      />
    </section>
  );
}
