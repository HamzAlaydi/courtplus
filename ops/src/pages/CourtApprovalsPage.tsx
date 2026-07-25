import { useState } from "react";
import {
  App,
  Button,
  Carousel,
  Descriptions,
  Drawer,
  Empty,
  Image,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  approveCourt,
  listPendingCourts,
  requestCourtChanges,
  suspendCourt,
  unsuspendCourt,
} from "@/api/ops";
import { apiErrorMessage } from "@/api/client";
import type { Court, CourtStatus } from "@/api/types";
import ReasonModal from "@/components/ReasonModal";
import StatusTag from "@/components/StatusTag";

const STATUS_OPTIONS: { value: CourtStatus; label: string }[] = [
  { value: "pending_approval", label: "Pending approval" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "suspended", label: "Suspended" },
  { value: "available", label: "Available" },
];

type ModerationAction = "request-changes" | "suspend";

export default function CourtApprovalsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<CourtStatus>("pending_approval");
  const [selected, setSelected] = useState<Court | null>(null);
  const [reasonAction, setReasonAction] = useState<ModerationAction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ops", "courts", "pending", { page, pageSize, status }],
    queryFn: () => listPendingCourts({ page, pageSize, status }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["ops", "courts"] });

  const approveMutation = useMutation({
    mutationFn: approveCourt,
    onSuccess: () => {
      message.success("Court approved");
      setSelected(null);
      invalidate();
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to approve court")),
  });

  const unsuspendMutation = useMutation({
    mutationFn: unsuspendCourt,
    onSuccess: () => {
      message.success("Court unsuspended");
      setSelected(null);
      invalidate();
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to unsuspend court")),
  });

  const reasonMutation = useMutation({
    mutationFn: ({ action, reason }: { action: ModerationAction; reason: string }) =>
      action === "request-changes"
        ? requestCourtChanges(selected!.id, reason)
        : suspendCourt(selected!.id, reason),
    onSuccess: (_, { action }) => {
      message.success(
        action === "request-changes" ? "Changes requested" : "Court suspended",
      );
      setReasonAction(null);
      setSelected(null);
      invalidate();
    },
    onError: (e) => message.error(apiErrorMessage(e, "Action failed")),
  });

  const images = (selected?.assets ?? []).filter((a) => a.type !== "court_video");
  const videos = (selected?.assets ?? []).filter((a) => a.type === "court_video");

  return (
    <>
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Court Approvals
        </Typography.Title>
        <Select
          value={status}
          options={STATUS_OPTIONS}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          style={{ width: 200 }}
        />
      </Space>

      <Table<Court>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.items}
        locale={{ emptyText: <Empty description="Queue is empty" /> }}
        onRow={(c) => ({
          onClick: () => setSelected(c),
          style: { cursor: "pointer" },
        })}
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
        columns={[
          {
            title: "Court",
            render: (_, c) => (
              <Typography.Text strong>{c.name || "Unnamed court"}</Typography.Text>
            ),
          },
          { title: "Branch", render: (_, c) => c.branch?.name ?? "—" },
          { title: "Vendor", render: (_, c) => c.branch?.tenant?.name ?? "—" },
          { title: "Sport", dataIndex: "sport" },
          {
            title: "Status",
            dataIndex: "status",
            render: (s: CourtStatus) => <StatusTag status={s} />,
          },
          {
            title: "Submitted",
            dataIndex: "submittedAt",
            render: (d?: string) => (d ? dayjs(d).format("MMM D, YYYY HH:mm") : "—"),
          },
          {
            title: "Media",
            render: (_, c) => <Tag>{c.assets?.length ?? 0} assets</Tag>,
          },
          {
            title: "Actions",
            width: 100,
            render: (_, c) => (
              <Button
                type="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(c);
                }}
              >
                Review
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        open={!!selected}
        width={640}
        title={selected?.name}
        onClose={() => setSelected(null)}
        extra={selected && <StatusTag status={selected.status} />}
      >
        {selected && (
          <>
            {images.length > 0 && (
              <Carousel arrows style={{ marginBottom: 16 }}>
                {images.map((a) => (
                  <div key={a.id}>
                    <Image
                      src={a.url}
                      alt={selected.name}
                      style={{ width: "100%", height: 300, objectFit: "cover", borderRadius: 8 }}
                    />
                  </div>
                ))}
              </Carousel>
            )}
            {videos.map((a) => (
              <video
                key={a.id}
                src={a.url}
                controls
                style={{ width: "100%", borderRadius: 8, marginBottom: 16 }}
              />
            ))}
            {images.length === 0 && videos.length === 0 && (
              <Empty description="No media uploaded" style={{ marginBottom: 16 }} />
            )}

            <Descriptions column={2} size="small" bordered items={[
              { key: "branch", label: "Branch", children: selected.branch?.name ?? "—" },
              { key: "vendor", label: "Vendor", children: selected.branch?.tenant?.name ?? "—" },
              { key: "sport", label: "Sport", children: selected.sport },
              { key: "surface", label: "Surface", children: selected.surface },
              { key: "size", label: "Size", children: `${selected.size} (${selected.length}m × ${selected.width}m)` },
              { key: "rate", label: "Hourly rate", children: `${selected.hourlyRate} ${selected.currency ?? ""}`.trim() },
              { key: "location", label: "Location", children: selected.location?.name ?? selected.branch?.location?.name ?? "—" },
              { key: "address", label: "Address", children: selected.location?.address ?? "—" },
              { key: "submitted", label: "Submitted", children: selected.submittedAt ? dayjs(selected.submittedAt).format("MMM D, YYYY HH:mm") : "—" },
              { key: "created", label: "Created", children: dayjs(selected.createdAt).format("MMM D, YYYY HH:mm") },
              ...(selected.description
                ? [{ key: "desc", label: "Description", children: selected.description, span: 2 as const }]
                : []),
            ]} />

            <Space style={{ marginTop: 24 }} wrap>
              {selected.status === "suspended" ? (
                <Popconfirm
                  title="Unsuspend this court?"
                  onConfirm={() => unsuspendMutation.mutate(selected.id)}
                >
                  <Button type="primary" loading={unsuspendMutation.isPending}>
                    Unsuspend
                  </Button>
                </Popconfirm>
              ) : (
                <Popconfirm
                  title="Approve this court?"
                  description="It will become visible to customers."
                  onConfirm={() => approveMutation.mutate(selected.id)}
                >
                  <Button type="primary" loading={approveMutation.isPending}>
                    Approve
                  </Button>
                </Popconfirm>
              )}
              {selected.status !== "suspended" && (
                <>
                  <Button onClick={() => setReasonAction("request-changes")}>
                    Request Changes
                  </Button>
                  <Button danger onClick={() => setReasonAction("suspend")}>
                    Suspend
                  </Button>
                </>
              )}
            </Space>
          </>
        )}
      </Drawer>

      <ReasonModal
        open={reasonAction !== null}
        title={
          reasonAction === "request-changes"
            ? `Request changes — ${selected?.name ?? ""}`
            : `Suspend court — ${selected?.name ?? ""}`
        }
        confirmText={reasonAction === "suspend" ? "Suspend" : "Send request"}
        danger={reasonAction === "suspend"}
        loading={reasonMutation.isPending}
        onConfirm={(reason) =>
          reasonAction && reasonMutation.mutate({ action: reasonAction, reason })
        }
        onCancel={() => setReasonAction(null)}
      />
    </>
  );
}
