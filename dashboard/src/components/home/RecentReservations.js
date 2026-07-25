import React from "react";
import { Empty, Table, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
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
      title: t("home.reservations.court"),
      key: "court",
      render: (_, record) => record.court?.name || "—",
    },
    {
      title: t("home.reservations.customer"),
      key: "customer",
      render: (_, record) => getCustomerName(record),
    },
    {
      title: t("home.reservations.date"),
      key: "date",
      render: (_, record) =>
        new Date(record.startDate).toLocaleDateString(i18n.language),
    },
    {
      title: t("home.reservations.time"),
      key: "time",
      render: (_, record) =>
        `${formatTime(record.startDate)} – ${formatTime(record.endDate)}`,
    },
    {
      title: t("home.reservations.duration"),
      key: "duration",
      render: (_, record) =>
        t("home.reservations.minutes", { count: record.duration }),
    },
    {
      title: t("home.reservations.amount"),
      key: "amount",
      render: (_, record) =>
        `${getAmount(record).toLocaleString()} ${(
          record.currency || ""
        ).toUpperCase()}`,
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
    <div className="home-card home-reservations">
      <h4 className="home-card-title">{t("home.reservations.title")}</h4>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={bookings}
        loading={isLoading}
        pagination={false}
        locale={{
          emptyText: <Empty description={t("home.reservations.empty")} />,
        }}
      />
    </div>
  );
}
