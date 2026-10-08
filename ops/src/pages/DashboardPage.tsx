import type { ReactNode } from "react";
import { Empty } from "antd";
import {
  ArrowRightOutlined,
  CheckSquareOutlined,
  HistoryOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { listLogs, listPendingCourts, listUnsuspendRequests } from "@/api/ops";
import PageHeader from "@/components/PageHeader";
import StatusTag from "@/components/StatusTag";

const POLL = 30_000;

interface KpiCardProps {
  label: string;
  value?: number;
  icon: ReactNode;
  loading: boolean;
  hero?: boolean;
  onClick: () => void;
}

function KpiCard({ label, value, icon, loading, hero, onClick }: KpiCardProps) {
  return (
    <button
      type="button"
      className={hero ? "ops-kpi ops-kpi--ink" : "ops-kpi"}
      onClick={onClick}
      aria-busy={loading}
    >
      <span className="ops-kpi__top">
        <span className="ops-kpi__label">{label}</span>
        <span className="ops-kpi__icon" aria-hidden="true">
          {icon}
        </span>
      </span>
      <span className="ops-kpi__bottom">
        {loading ? (
          <span className="ops-skeleton" style={{ width: 72, height: 32 }} />
        ) : (
          <span className="ops-kpi__value">{(value ?? 0).toLocaleString("en-US")}</span>
        )}
        <span className="ops-kpi__go" aria-hidden="true">
          <ArrowRightOutlined />
        </span>
      </span>
    </button>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: pendingCourts } = useQuery({
    queryKey: ["ops", "courts", "pending", "count"],
    queryFn: () => listPendingCourts({ page: 1, pageSize: 1 }),
    refetchInterval: POLL,
  });

  const { data: unsuspendRequests } = useQuery({
    queryKey: ["ops", "unsuspend-requests", "count"],
    queryFn: () => listUnsuspendRequests({ page: 1, pageSize: 1 }),
    refetchInterval: POLL,
  });

  const { data: recentLogs } = useQuery({
    queryKey: ["ops", "logs", "recent"],
    queryFn: () => listLogs({ page: 1, pageSize: 8 }),
    refetchInterval: POLL,
  });

  return (
    <div className="ops-page">
      <PageHeader title="Dashboard" />

      <div className="ops-kpi-grid">
        <KpiCard
          hero
          label="Courts pending review"
          value={pendingCourts?.pagination.totalCount}
          icon={<CheckSquareOutlined />}
          loading={!pendingCourts}
          onClick={() => navigate("/approvals")}
        />
        <KpiCard
          label="Pending unsuspend requests"
          value={unsuspendRequests?.pagination.totalCount}
          icon={<ShopOutlined />}
          loading={!unsuspendRequests}
          onClick={() => navigate("/vendors?tab=requests")}
        />
        <KpiCard
          label="Audit log entries"
          value={recentLogs?.pagination.totalCount}
          icon={<HistoryOutlined />}
          loading={!recentLogs}
          onClick={() => navigate("/logs")}
        />
      </div>

      <section className="ops-card" aria-busy={!recentLogs}>
        <div className="ops-card__head">
          <h2 className="ops-section-title">Recent activity</h2>
          <button type="button" className="ops-link" onClick={() => navigate("/logs")}>
            Activity Log
            <ArrowRightOutlined />
          </button>
        </div>

        {!recentLogs ? (
          <ul className="ops-list">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="ops-list__row">
                <span className="ops-list__avatar" />
                <span className="ops-list__main" style={{ gap: 8 }}>
                  <span className="ops-skeleton" style={{ width: "55%" }} />
                  <span className="ops-skeleton" style={{ width: "25%", height: 10 }} />
                </span>
              </li>
            ))}
          </ul>
        ) : recentLogs.items.length === 0 ? (
          <Empty
            className="ops-empty"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No activity yet"
          />
        ) : (
          <ul className="ops-list">
            {recentLogs.items.map((log) => {
              const actor = log.actorEmail ?? "system";
              return (
                <li key={log.id} className="ops-list__row">
                  <span className="ops-list__avatar" aria-hidden="true">
                    {actor.charAt(0).toUpperCase()}
                  </span>
                  <span className="ops-list__main">
                    <span className="ops-list__title">
                      <strong>{actor}</strong>
                      {` ${log.action} `}
                      <StatusTag status={log.entity} size="sm" />
                    </span>
                  </span>
                  <span className="ops-list__aside">
                    {dayjs(log.createdAt).format("MMM D, YYYY HH:mm:ss")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
