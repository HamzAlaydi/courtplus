import { useState } from "react";
import { App, Button, Empty, Popconfirm, Segmented, Space, Table, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { approvePayout, listPayouts, markPayoutSent, rejectPayout } from "@/api/ops";
import { apiErrorMessage } from "@/api/client";
import PageHeader from "@/components/PageHeader";
import ReasonModal from "@/components/ReasonModal";
import StatusTag from "@/components/StatusTag";
import TableSkeleton from "@/components/TableSkeleton";
import type { Payout, PayoutStatus } from "@/api/types";

const STATUS_OPTIONS: { value: PayoutStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending review" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Rejected" },
  { value: "all", label: "All" },
];

const money = (amount: number, currency: string) =>
  `${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;

/**
 * Vendor payout requests. Approving sends the Stripe transfer to the vendor's
 * connected account; rejecting returns the held amount to their balance.
 */
export default function PayoutsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PayoutStatus | "all">("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rejecting, setRejecting] = useState<Payout | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ops", "payouts", { status, page, pageSize }],
    queryFn: () => listPayouts({ page, pageSize, status: status === "all" ? undefined : status }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["ops", "payouts"] });

  const approveMutation = useMutation({
    mutationFn: approvePayout,
    onSuccess: () => {
      message.success("Payout approved and transfer initiated");
      refresh();
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to approve payout")),
  });

  const markSentMutation = useMutation({
    mutationFn: (id: string) => markPayoutSent(id),
    onSuccess: () => {
      message.success("Payout marked as sent");
      queryClient.invalidateQueries({ queryKey: ["ops", "payouts"] });
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to mark payout as sent")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectPayout(id, reason),
    onSuccess: () => {
      message.success("Payout rejected and balance restored");
      setRejecting(null);
      refresh();
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to reject payout")),
  });

  const total = data?.pagination.totalCount;

  return (
    <div className="ops-page">
      <PageHeader
        title="Payouts"
        subtitle={
          total === undefined
            ? undefined
            : `${total} payout ${total === 1 ? "request" : "requests"}`
        }
        extra={
          <Segmented<PayoutStatus | "all">
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

      <Table<Payout>
        rowKey="id"
        dataSource={data?.items ?? []}
        scroll={{ x: true }}
        locale={{
          emptyText: isLoading ? (
            <TableSkeleton lead="none" meta />
          ) : (
            <Empty className="ops-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ),
        }}
        pagination={{
          current: page,
          pageSize,
          total: data?.pagination.totalCount ?? 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        columns={[
          {
            title: "Requested",
            dataIndex: "createdAt",
            render: (v: string) => (
              <span
                className="ops-muted"
                style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
              >
                {dayjs(v).format("YYYY-MM-DD HH:mm")}
              </span>
            ),
          },
          {
            title: "Vendor",
            render: (_, row) => {
              const name = row.tenant?.name ?? row.tenantId;
              return (
                <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 220 }}>
                  <span className="ops-list__avatar" aria-hidden="true">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontWeight: 600 }}>{name}</span>
                    {row.requestedBy ? (
                      <span className="ops-muted" style={{ fontSize: 12 }}>
                        {row.requestedBy.firstName} {row.requestedBy.lastName} ·{" "}
                        {row.requestedBy.email}
                      </span>
                    ) : null}
                  </span>
                </span>
              );
            },
          },
          {
            title: "Amount",
            dataIndex: "amount",
            render: (v: number, row) => (
              <span
                style={{
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {money(v, row.currency)}
              </span>
            ),
          },
          {
            title: "Status",
            dataIndex: "status",
            render: (s: PayoutStatus, row) => (
              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                }}
              >
                <StatusTag
                  status={s}
                  label={s === "cancelled" ? "Rejected" : undefined}
                  tone={s === "cancelled" ? "danger" : undefined}
                />
                {row.failureReason ? (
                  <span className="ops-muted" style={{ fontSize: 12, maxWidth: 260 }}>
                    {row.failureReason}
                  </span>
                ) : null}
                {row.sentAt ? (
                  <span className="ops-muted" style={{ fontSize: 12 }}>
                    sent {dayjs(row.sentAt).format("YYYY-MM-DD HH:mm")}
                  </span>
                ) : null}
              </span>
            ),
          },
          {
            title: "Actions",
            render: (_, row) =>
              row.status === "pending" ? (
                <Space size={8}>
                  <Popconfirm
                    title={`Send ${money(row.amount, row.currency)} to this vendor?`}
                    description="Stripe payouts are sent immediately; bank-transfer vendors move to 'processing' for you to send and confirm."
                    okText="Approve"
                    onConfirm={() => approveMutation.mutate(row.id)}
                  >
                    <Button
                      type="primary"
                      size="small"
                      loading={approveMutation.isPending && approveMutation.variables === row.id}
                    >
                      Approve
                    </Button>
                  </Popconfirm>
                  <Button danger size="small" onClick={() => setRejecting(row)}>
                    Reject
                  </Button>
                </Space>
              ) : row.status === "processing" ? (
                // A manual bank transfer sits here until ops confirms it left
                // the bank; a Stripe transfer is closed by its webhook instead.
                <Popconfirm
                  title={`Confirm ${money(row.amount, row.currency)} was transferred?`}
                  description="Only do this once the bank transfer has actually been sent."
                  okText="Mark sent"
                  onConfirm={() => markSentMutation.mutate(row.id)}
                >
                  <Button
                    size="small"
                    loading={markSentMutation.isPending && markSentMutation.variables === row.id}
                  >
                    Mark sent
                  </Button>
                </Popconfirm>
              ) : (
                <Typography.Text type="secondary">—</Typography.Text>
              ),
          },
        ]}
      />

      <ReasonModal
        open={!!rejecting}
        title={
          rejecting
            ? `Reject payout of ${money(rejecting.amount, rejecting.currency)}`
            : "Reject payout"
        }
        confirmText="Reject"
        danger
        loading={rejectMutation.isPending}
        onConfirm={(reason) => rejecting && rejectMutation.mutate({ id: rejecting.id, reason })}
        onCancel={() => setRejecting(null)}
      />
    </div>
  );
}
