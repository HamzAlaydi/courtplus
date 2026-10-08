import { useState } from "react";
import { Col, DatePicker, Empty, Input, Row, Select, Table } from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { listLogs } from "@/api/ops";
import type { LogAction, LogEntity, OpsLog } from "@/api/types";
import PageHeader from "@/components/PageHeader";
import StatusTag from "@/components/StatusTag";
import TableSkeleton from "@/components/TableSkeleton";
import { COLORS } from "@/theme";

const ENTITY_OPTIONS: LogEntity[] = [
  "user",
  "booking",
  "review",
  "court",
  "branch",
  "tenant",
  "staff",
  "subscription",
  "ops_admin",
  "unsuspend_request",
];

const ACTION_OPTIONS: LogAction[] = ["create", "update", "delete"];

function SnapshotView({ title, value }: { title: string; value?: Record<string, unknown> | null }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <span
        className="ops-muted"
        style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.02em" }}
      >
        {title}
      </span>
      <pre
        style={{
          margin: 0,
          background: COLORS.ink,
          color: COLORS.sidebarText,
          padding: "14px 16px",
          borderRadius: 14,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: 12,
          lineHeight: 1.6,
          maxHeight: 320,
          overflow: "auto",
        }}
      >
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actorEmail, setActorEmail] = useState("");
  const [entity, setEntity] = useState<LogEntity | undefined>();
  const [action, setAction] = useState<LogAction | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const filters = {
    actorEmail: actorEmail || undefined,
    entity,
    action,
    from: range?.[0]?.startOf("day").toISOString(),
    to: range?.[1]?.endOf("day").toISOString(),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["ops", "logs", { page, pageSize, ...filters }],
    queryFn: () => listLogs({ page, pageSize, ...filters }),
  });

  const resetPage = () => setPage(1);

  const total = data?.pagination.totalCount;

  return (
    <div className="ops-page">
      <PageHeader
        title="Activity Log"
        subtitle={
          total === undefined
            ? undefined
            : `${total.toLocaleString("en-US")} ${total === 1 ? "entry" : "entries"}`
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8} lg={6}>
            <Input.Search
              placeholder="Filter by actor email"
              allowClear
              onSearch={(v) => {
                setActorEmail(v.trim());
                resetPage();
              }}
            />
          </Col>
          <Col xs={12} sm={5} lg={4}>
            <Select
              placeholder="Entity"
              allowClear
              style={{ width: "100%" }}
              options={ENTITY_OPTIONS.map((e) => ({ value: e, label: e.replace(/_/g, " ") }))}
              value={entity}
              onChange={(v) => {
                setEntity(v);
                resetPage();
              }}
            />
          </Col>
          <Col xs={12} sm={5} lg={4}>
            <Select
              placeholder="Action"
              allowClear
              style={{ width: "100%" }}
              options={ACTION_OPTIONS.map((a) => ({ value: a, label: a }))}
              value={action}
              onChange={(v) => {
                setAction(v);
                resetPage();
              }}
            />
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              value={range}
              onChange={(v) => {
                setRange(v);
                resetPage();
              }}
            />
          </Col>
        </Row>

        <Table<OpsLog>
          rowKey="id"
          dataSource={data?.items}
          scroll={{ x: true }}
          locale={{
            emptyText: isLoading ? (
              <TableSkeleton />
            ) : (
              <Empty className="ops-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total: data?.pagination.totalCount,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          expandable={{
            rowExpandable: (r) => !!(r.oldSnapshot || r.newSnapshot),
            expandedRowRender: (r) => (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <SnapshotView title="Old snapshot" value={r.oldSnapshot} />
                </Col>
                <Col xs={24} md={12}>
                  <SnapshotView title="New snapshot" value={r.newSnapshot} />
                </Col>
              </Row>
            ),
          }}
          columns={[
            {
              title: "Time",
              dataIndex: "createdAt",
              width: 180,
              render: (d: string) => (
                <span
                  className="ops-muted"
                  style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
                >
                  {dayjs(d).format("MMM D, YYYY HH:mm:ss")}
                </span>
              ),
            },
            {
              title: "Actor",
              dataIndex: "actorEmail",
              render: (v?: string) => {
                const actor = v ?? "system";
                return (
                  <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
                    <span className="ops-list__avatar" aria-hidden="true">
                      {actor.charAt(0).toUpperCase()}
                    </span>
                    <span
                      className={v ? undefined : "ops-muted"}
                      style={{ fontWeight: v ? 600 : 400, overflowWrap: "anywhere" }}
                    >
                      {actor}
                    </span>
                  </span>
                );
              },
            },
            {
              title: "Entity",
              dataIndex: "entity",
              width: 160,
              render: (e: LogEntity) => <StatusTag status={e} />,
            },
            {
              title: "Action",
              dataIndex: "action",
              width: 110,
              render: (a: LogAction) => <StatusTag status={a} />,
            },
            {
              title: "IP",
              dataIndex: "ip",
              width: 130,
              render: (v?: string) => (
                <span className="ops-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {v ?? "—"}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
