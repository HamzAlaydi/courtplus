import { useId, useState } from "react";
import {
  App,
  Button,
  Carousel,
  Drawer,
  Empty,
  Image,
  Popconfirm,
  Segmented,
  Table,
  Typography,
} from "antd";
import { ArrowRightOutlined, CloseOutlined, PictureOutlined } from "@ant-design/icons";
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
import PageHeader from "@/components/PageHeader";
import ReasonModal from "@/components/ReasonModal";
import StatusTag from "@/components/StatusTag";
import TableSkeleton from "@/components/TableSkeleton";
import { COLORS } from "@/theme";

const STATUS_OPTIONS: { value: CourtStatus; label: string }[] = [
  { value: "pending_approval", label: "Pending approval" },
  { value: "changes_requested", label: "Changes requested" },
  { value: "suspended", label: "Suspended" },
  { value: "available", label: "Available" },
];

type ModerationAction = "request-changes" | "suspend";

const coverOf = (c: Court) => (c.assets ?? []).find((a) => a.type !== "court_video" && a.url)?.url;

export default function CourtApprovalsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const titleId = useId();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<CourtStatus>("pending_approval");
  const [selected, setSelected] = useState<Court | null>(null);
  const [reasonAction, setReasonAction] = useState<ModerationAction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ops", "courts", "pending", { page, pageSize, status }],
    queryFn: () => listPendingCourts({ page, pageSize, status }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["ops", "courts"] });

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
      message.success(action === "request-changes" ? "Changes requested" : "Court suspended");
      setReasonAction(null);
      setSelected(null);
      invalidate();
    },
    onError: (e) => message.error(apiErrorMessage(e, "Action failed")),
  });

  const images = (selected?.assets ?? []).filter((a) => a.type !== "court_video");
  const videos = (selected?.assets ?? []).filter((a) => a.type === "court_video");

  const total = data?.pagination.totalCount;
  const subtitle =
    total === undefined
      ? undefined
      : status === "pending_approval"
        ? `${total} ${total === 1 ? "court is" : "courts are"} waiting for review`
        : `${total} ${total === 1 ? "court" : "courts"}`;

  const formatDate = (d?: string) => (d ? dayjs(d).format("MMM D, YYYY HH:mm") : "—");

  return (
    <div className="ops-page">
      <PageHeader
        title="Court Approvals"
        subtitle={subtitle}
        extra={
          <Segmented<CourtStatus>
            aria-label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
        }
      />

      <Table<Court>
        rowKey="id"
        dataSource={data?.items}
        scroll={{ x: true }}
        locale={{
          emptyText: isLoading ? (
            <TableSkeleton lead="thumb" meta />
          ) : (
            <Empty
              className="ops-empty"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Queue is empty"
            />
          ),
        }}
        rowClassName={(c) => (c.id === selected?.id ? "ant-table-row-selected" : "")}
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
            render: (_, c) => {
              const cover = coverOf(c);
              return (
                <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 200 }}>
                  {cover ? (
                    <img className="ops-thumb" src={cover} alt="" loading="lazy" />
                  ) : (
                    <span
                      className="ops-thumb"
                      aria-hidden="true"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: COLORS.faint,
                        fontSize: 18,
                      }}
                    >
                      <PictureOutlined />
                    </span>
                  )}
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontWeight: 600 }}>{c.name || "Unnamed court"}</span>
                    <span className="ops-muted" style={{ fontSize: 12 }}>
                      {c.branch?.name ?? "—"}
                    </span>
                  </span>
                </span>
              );
            },
          },
          {
            title: "Vendor",
            render: (_, c) => c.branch?.tenant?.name ?? <span className="ops-muted">—</span>,
          },
          {
            title: "Sport",
            dataIndex: "sport",
            render: (s: string) => <span style={{ textTransform: "capitalize" }}>{s}</span>,
          },
          {
            title: "A/C",
            width: 80,
            render: (_, c) => <StatusTag status={c.isAirConditioned ? "yes" : "no"} />,
          },
          {
            title: "Women",
            width: 90,
            render: (_, c) => <StatusTag status={c.isWomenOnly ? "yes" : "no"} />,
          },
          {
            title: "Status",
            dataIndex: "status",
            render: (s: CourtStatus) => <StatusTag status={s} />,
          },
          {
            title: "Submitted",
            dataIndex: "submittedAt",
            render: (d?: string) => (
              <span className="ops-muted" style={{ whiteSpace: "nowrap" }}>
                {formatDate(d)}
              </span>
            ),
          },
          {
            title: "Media",
            render: (_, c) => (
              <StatusTag status="assets" tone="neutral" label={`${c.assets?.length ?? 0} assets`} />
            ),
          },
          {
            title: "Actions",
            width: 100,
            render: (_, c) => (
              <Button
                size="small"
                icon={<ArrowRightOutlined />}
                iconPosition="end"
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
        width="min(520px, 100vw)"
        closable={false}
        aria-labelledby={titleId}
        onClose={() => setSelected(null)}
        styles={{ body: { padding: 0 } }}
        footer={
          selected && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              {/* Only the actions the backend accepts for this status: the
                  old drawer offered Approve/Suspend on every court and every
                  click outside the right state was a 400. */}
              {selected.status === "suspended" && (
                <Popconfirm
                  title="Unsuspend this court?"
                  onConfirm={() => unsuspendMutation.mutate(selected.id)}
                >
                  <Button type="primary" loading={unsuspendMutation.isPending} style={{ flex: 1 }}>
                    Unsuspend
                  </Button>
                </Popconfirm>
              )}
              {selected.status === "pending_approval" && (
                <>
                  <Popconfirm
                    title="Approve this court?"
                    description="It will become visible to customers."
                    onConfirm={() => approveMutation.mutate(selected.id)}
                  >
                    <Button
                      type="primary"
                      loading={approveMutation.isPending}
                      style={{ flex: 1, fontWeight: 700 }}
                    >
                      Approve
                    </Button>
                  </Popconfirm>
                  <Button style={{ flex: 1 }} onClick={() => setReasonAction("request-changes")}>
                    Request Changes
                  </Button>
                </>
              )}
              {selected.status === "available" && (
                <Button danger style={{ flex: 1 }} onClick={() => setReasonAction("suspend")}>
                  Suspend
                </Button>
              )}
              {selected.status === "changes_requested" && (
                <Typography.Text type="secondary">
                  Waiting for the vendor to resubmit.
                </Typography.Text>
              )}
              {selected.status === "pending_payment" && (
                <Typography.Text type="secondary">
                  Waiting for the vendor's payment.
                </Typography.Text>
              )}
            </div>
          )
        }
      >
        {selected && (
          <>
            {/* Zero-height sticky rail: the close button stays pinned over the
                scrolling body (on phones the drawer is full screen, so there is
                no mask to click) without pushing the image down. */}
            <div style={{ position: "sticky", top: 0, height: 0, zIndex: 20 }}>
              <button
                type="button"
                className="ops-icon-btn"
                aria-label="Close"
                onClick={() => setSelected(null)}
                style={{
                  position: "absolute",
                  top: 16,
                  insetInlineEnd: 16,
                  fontSize: 15,
                }}
              >
                <CloseOutlined />
              </button>
            </div>
            <div style={{ background: COLORS.ground }}>
              {images.length > 0 ? (
                <Carousel arrows={images.length > 1} dots={images.length > 1}>
                  {images.map((a) => (
                    <div key={a.id}>
                      <Image
                        src={a.url}
                        alt={selected.name}
                        width="100%"
                        height={260}
                        wrapperStyle={{ display: "block" }}
                        style={{ objectFit: "cover", display: "block" }}
                      />
                    </div>
                  ))}
                </Carousel>
              ) : videos.length > 0 ? (
                videos.map((a) => (
                  <video
                    key={a.id}
                    src={a.url}
                    controls
                    style={{
                      display: "block",
                      width: "100%",
                      maxHeight: 300,
                      background: COLORS.ink,
                    }}
                  />
                ))
              ) : (
                <div
                  style={{
                    height: 180,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    color: COLORS.muted,
                    fontSize: 13,
                  }}
                >
                  <PictureOutlined style={{ fontSize: 28, color: COLORS.faint }} />
                  No media uploaded
                </div>
              )}
            </div>

            <div
              style={{
                padding: "20px 24px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <StatusTag status={selected.status} style={{ alignSelf: "flex-start" }} />
                <h2
                  id={titleId}
                  className="ops-page-title"
                  style={{ fontSize: 20, overflowWrap: "anywhere" }}
                >
                  {selected.name || "Unnamed court"}
                </h2>
                {selected.branch?.name ? (
                  <span className="ops-muted" style={{ fontSize: 13 }}>
                    {selected.branch.name}
                  </span>
                ) : null}
              </div>

              {images.length > 0 &&
                videos.map((a) => (
                  <video
                    key={a.id}
                    src={a.url}
                    controls
                    style={{
                      display: "block",
                      width: "100%",
                      borderRadius: 14,
                      background: COLORS.ink,
                    }}
                  />
                ))}

              <dl className="ops-dl">
                <dt>Vendor</dt>
                <dd>{selected.branch?.tenant?.name ?? "—"}</dd>
                <dt>Sport</dt>
                <dd style={{ textTransform: "capitalize" }}>{selected.sport}</dd>
                <dt>Surface</dt>
                <dd style={{ textTransform: "capitalize" }}>{selected.surface}</dd>
                <dt>Air conditioned</dt>
                <dd>{selected.isAirConditioned ? "Yes" : "No"}</dd>
                <dt>Women only</dt>
                <dd>{selected.isWomenOnly ? "Yes" : "No"}</dd>
                <dt>Size</dt>
                <dd>{`${selected.size} (${selected.length}m × ${selected.width}m)`}</dd>
                <dt>Hourly rate</dt>
                <dd>{`${selected.hourlyRate} ${selected.currency ?? ""}`.trim()}</dd>
                <dt>Location</dt>
                <dd>{selected.location?.name ?? selected.branch?.location?.name ?? "—"}</dd>
                <dt>Address</dt>
                <dd style={{ overflowWrap: "anywhere" }}>{selected.location?.address ?? "—"}</dd>
                <dt>Submitted</dt>
                <dd>{formatDate(selected.submittedAt)}</dd>
                <dt>Created</dt>
                <dd>{formatDate(selected.createdAt)}</dd>
              </dl>

              {selected.description ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    paddingTop: 16,
                    borderTop: `1px solid ${COLORS.divider}`,
                  }}
                >
                  <span className="ops-muted" style={{ fontSize: 13 }}>
                    Description
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {selected.description}
                  </p>
                </div>
              ) : null}
            </div>
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
    </div>
  );
}
