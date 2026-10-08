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

// Court+ chart palette (mirrors src/styles/base/_variables.scss)
const INK = "#0A1517";
const LIME = "#C0FF42";
const MUTED = "#627174";
const LINE = "#E4E9E8";
const DIVIDER = "#EEF1F0";
const GROUND = "#F3F5F4";
const FONT_TEXT = "'Readex Pro', system-ui, sans-serif";

const AXIS_TICK = { fontSize: 12, fill: MUTED, fontFamily: FONT_TEXT };

const TOOLTIP_PROPS = {
  contentStyle: {
    background: "#FFFFFF",
    border: "none",
    borderRadius: 12,
    boxShadow:
      "0 2px 6px rgba(10, 21, 23, 0.06), 0 14px 36px rgba(10, 21, 23, 0.14)",
    padding: "8px 12px",
    fontFamily: FONT_TEXT,
    fontSize: 13,
  },
  labelStyle: { color: MUTED, fontSize: 12, marginBottom: 2 },
  itemStyle: { color: INK, fontWeight: 600, padding: 0 },
};

const formatPointDate = (x, language) =>
  new Date(x).toLocaleDateString(language, { month: "short", day: "numeric" });

const toChartData = (series, language) =>
  (series?.points || []).map((point) => ({
    date: formatPointDate(point.x, language),
    value: Number(point.y) || 0,
  }));

const ChartCard = ({ title, empty, children, isEmpty }) => (
  <section className="cp-card home-card home-chart-card">
    <div className="cp-section-head">
      <h3 className="cp-section-title">{title}</h3>
    </div>
    {isEmpty ? (
      <div className="home-chart-empty">
        <Empty description={empty} />
      </div>
    ) : (
      // recharts measures LTR layouts; keep charts LTR in RTL mode
      <div dir="ltr" className="home-chart-body">
        <ResponsiveContainer width="100%" height={260}>
          {children}
        </ResponsiveContainer>
      </div>
    )}
  </section>
);

export default function HomeCharts({ stats }) {
  const { t, i18n } = useTranslation();

  const revenueData = toChartData(stats?.revenueChart, i18n.language);
  const bookingsData = toChartData(stats?.totalBookingsChart, i18n.language);

  const compactNumber = (value) =>
    Intl.NumberFormat(i18n.language, { notation: "compact" }).format(value);

  return (
    <div className="cp-grid-2 home-charts">
      <ChartCard
        title={t("home.charts.revenueTitle")}
        empty={t("home.charts.empty")}
        isEmpty={!revenueData.length}
      >
        <AreaChart
          data={revenueData}
          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LIME} stopOpacity={0.55} />
              <stop offset="100%" stopColor={LIME} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={DIVIDER} vertical={false} />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: LINE }}
            tickMargin={8}
            minTickGap={16}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={compactNumber}
            width={48}
          />
          <Tooltip
            {...TOOLTIP_PROPS}
            cursor={{ stroke: LINE, strokeWidth: 1 }}
            formatter={(value) => [
              `${Number(value).toLocaleString()} ${t("home.currency")}`,
              t("home.charts.revenue"),
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={INK}
            strokeWidth={2}
            fill="url(#revenueGradient)"
            activeDot={{ r: 5, fill: LIME, stroke: INK, strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartCard>

      <ChartCard
        title={t("home.charts.bookingsTitle")}
        empty={t("home.charts.empty")}
        isEmpty={!bookingsData.length}
      >
        <BarChart
          data={bookingsData}
          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke={DIVIDER} vertical={false} />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: LINE }}
            tickMargin={8}
            minTickGap={16}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            {...TOOLTIP_PROPS}
            cursor={{ fill: GROUND }}
            formatter={(value) => [value, t("home.charts.bookings")]}
          />
          <Bar
            dataKey="value"
            fill={INK}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            activeBar={{ fill: LIME, stroke: INK, strokeWidth: 1 }}
          />
        </BarChart>
      </ChartCard>
    </div>
  );
}
