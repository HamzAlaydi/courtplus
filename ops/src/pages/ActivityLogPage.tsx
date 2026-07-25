import { useState } from "react";
import {
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { listLogs } from "@/api/ops";
import type { LogAction, LogEntity, OpsLog } from "@/api/types";
import StatusTag from "@/components/StatusTag";

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

const ACTION_COLORS: Record<LogAction, string> = {
  create: "green",
  update: "gold",
  delete: "red",
};

function SnapshotView({ title, value }: { title: string; value?: Record<string, unknown> | null }) {
  return (
    <div>
      <Typography.Text strong style={{ fontSize: 12 }}>
        {title}
      </Typography.Text>
      <pre
        style={{
          background: "#0a1517",
          color: "#d9f7be",
          padding: 12,
          borderRadius: 8,
          fontSize: 12,
          maxHeight: 320,
          overflow: "auto",
          marginTop: 4,
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

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Activity Log
      </Typography.Title>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
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
        loading={isLoading}
        dataSource={data?.items}
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
            <Row gutter={16}>
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
            render: (d: string) => dayjs(d).format("MMM D, YYYY HH:mm:ss"),
          },
          { title: "Actor", dataIndex: "actorEmail", render: (v?: string) => v ?? "system" },
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
            render: (a: LogAction) => <Tag color={ACTION_COLORS[a]}>{a}</Tag>,
          },
          { title: "IP", dataIndex: "ip", width: 130, render: (v?: string) => v ?? "—" },
        ]}
      />
    </>
  );
}
