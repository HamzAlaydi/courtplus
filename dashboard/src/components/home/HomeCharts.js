import React from "react";
import { Empty } from "antd";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";

const formatPointDate = (x, language) =>
  new Date(x).toLocaleDateString(language, { month: "short", day: "numeric" });

const toChartData = (series, language) =>
  (series?.points || []).map((point) => ({
    date: formatPointDate(point.x, language),
    value: Number(point.y) || 0,
  }));

const ChartCard = ({ title, empty, children, isEmpty }) => (
  <div className="home-chart-card">
    <h4 className="home-card-title">{title}</h4>
    {isEmpty ? (
      <div className="home-chart-empty">
        <Empty description={empty} />
      </div>
    ) : (
      // recharts measures LTR layouts; keep charts LTR in RTL mode
      <div dir="ltr">
        <ResponsiveContainer width="100%" height={280}>
          {children}
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

export default function HomeCharts({ stats }) {
  const { t, i18n } = useTranslation();

  const revenueData = toChartData(stats?.revenueChart, i18n.language);
  const bookingsData = toChartData(stats?.totalBookingsChart, i18n.language);

  const compactNumber = (value) =>
    Intl.NumberFormat(i18n.language, { notation: "compact" }).format(value);

  return (
    <div className="home-charts">
      <ChartCard
        title={t("home.charts.revenueTitle")}
        empty={t("home.charts.empty")}
        isEmpty={!revenueData.length}
      >
        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#54c39e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#54c39e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={compactNumber}
            width={55}
          />
          <Tooltip
            formatter={(value) => [
              `${Number(value).toLocaleString()} ${t("home.currency")}`,
              t("home.charts.revenue"),
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#54c39e"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ChartCard>

      <ChartCard
        title={t("home.charts.bookingsTitle")}
        empty={t("home.charts.empty")}
        isEmpty={!bookingsData.length}
      >
        <BarChart data={bookingsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={35}
          />
          <Tooltip
            formatter={(value) => [value, t("home.charts.bookings")]}
          />
          <Bar dataKey="value" fill="#c0ff42" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}
