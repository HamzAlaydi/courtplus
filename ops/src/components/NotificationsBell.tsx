import { useState } from "react";
import {
  Badge,
  Button,
  List,
  Popover,
  Space,
  Spin,
  Typography,
  Empty,
  Tooltip,
} from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  getUnseenCount,
  listNotifications,
  markAllNotificationsSeen,
  markNotificationRead,
} from "@/api/notifications";
import type { AppNotification } from "@/api/types";
import { LIME } from "@/theme";

/** Deep-link a notification to the relevant console page by data.kind. */
function notificationTarget(n: AppNotification): string {
  const kind = n.data?.kind ?? n.type;
  if (kind.startsWith("court_")) return "/approvals";
  if (kind === "tenant_unsuspend_requested") return "/vendors?tab=requests";
  if (kind.startsWith("tenant_") || kind.startsWith("branch_")) return "/vendors";
  return "/";
}

function notificationText(n: AppNotification): string {
  const d = n.data ?? {};
  switch (d.kind ?? n.type) {
    case "court_resubmitted":
      return `Court "${d.courtName ?? "—"}" was resubmitted for review`;
    case "court_pending_approval":
      return `Court "${d.courtName ?? "—"}" is pending approval`;
    case "tenant_unsuspend_requested":
      return `${d.tenantName ?? "A vendor"} requested to be unsuspended`;
    default:
      return n.title ?? n.content ?? n.type.replace(/_/g, " ");
  }
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unseen = 0 } = useQuery({
    queryKey: ["notifications", "unseen-count"],
    queryFn: getUnseenCount,
    refetchInterval: 30_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => listNotifications({ page: 1, pageSize: 15 }),
    refetchInterval: 30_000,
    enabled: open,
  });

  const unreadItems = (data?.items ?? []).filter((n) => !n.readAt);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const seenMutation = useMutation({
    mutationFn: markAllNotificationsSeen,
    onSuccess: invalidate,
  });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  });

  // No bulk mark-read endpoint exists — loop the per-item PATCH /:id/read.
  const markAllReadMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(markNotificationRead)),
    onSuccess: invalidate,
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && unseen > 0) seenMutation.mutate();
  };

  const handleClick = (n: AppNotification) => {
    if (!n.readAt) readMutation.mutate(n.id);
    setOpen(false);
    navigate(notificationTarget(n));
  };

  const title = (
    <Space style={{ width: "100%", justifyContent: "space-between" }}>
      <span>Notifications</span>
      <Button
        type="link"
        size="small"
        style={{ padding: 0 }}
        disabled={unreadItems.length === 0}
        loading={markAllReadMutation.isPending}
        onClick={() => markAllReadMutation.mutate(unreadItems.map((n) => n.id))}
      >
        Mark all as read
      </Button>
    </Space>
  );

  const content = (
    <div style={{ width: 360, maxHeight: 420, overflowY: "auto" }}>
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : !data?.items.length ? (
        <Empty description="No notifications" style={{ padding: 24 }} />
      ) : (
        <List
          size="small"
          dataSource={data.items}
          renderItem={(n) => {
            const unread = !n.readAt;
            return (
              <List.Item
                onClick={() => handleClick(n)}
                style={{
                  cursor: "pointer",
                  padding: "10px 12px",
                  background: unread ? "rgba(200,245,66,0.10)" : undefined,
                }}
                actions={
                  unread
                    ? [
                        <Tooltip title="Mark as read" key="read">
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              readMutation.mutate(n.id);
                            }}
                          />
                        </Tooltip>,
                      ]
                    : undefined
                }
              >
                <List.Item.Meta
                  avatar={
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: unread ? LIME : "transparent",
                        marginTop: 6,
                      }}
                    />
                  }
                  title={
                    <Typography.Text strong={unread} style={{ fontSize: 13 }}>
                      {notificationText(n)}
                    </Typography.Text>
                  }
                  description={
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(n.createdAt).format("MMM D, YYYY HH:mm")}
                    </Typography.Text>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title={title}
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
    >
      <Badge count={unseen} size="small" offset={[-4, 4]}>
        <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
      </Badge>
    </Popover>
  );
}
