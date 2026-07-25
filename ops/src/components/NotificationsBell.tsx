import { useState } from "react";
import {
  Badge,
  Button,
  List,
  Popover,
  Spin,
  Typography,
  Empty,
} from "antd";
import { BellOutlined } from "@ant-design/icons";
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

  const seenMutation = useMutation({
    mutationFn: markAllNotificationsSeen,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
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
          renderItem={(n) => (
            <List.Item
              onClick={() => handleClick(n)}
              style={{
                cursor: "pointer",
                padding: "10px 12px",
                background: n.readAt ? undefined : "rgba(200,245,66,0.10)",
              }}
            >
              <List.Item.Meta
                title={
                  <Typography.Text strong={!n.readAt} style={{ fontSize: 13 }}>
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
          )}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title="Notifications"
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
