import { useState } from "react";
import { App, Badge, Button, Empty, List, Popover, Typography, Tooltip } from "antd";
import { BellOutlined, CheckOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  getUnseenCount,
  listNotifications,
  markAllNotificationsRead,
  markAllNotificationsSeen,
  markNotificationRead,
} from "@/api/notifications";
import type { AppNotification } from "@/api/types";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { COLORS } from "@/theme";

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

  const { message } = App.useApp();

  const { data: unseen = 0 } = useQuery({
    queryKey: ["notifications", "unseen-count"],
    queryFn: getUnseenCount,
    // Fallback only: the stream below updates the badge the moment a
    // notification is created. Polling covers a dropped stream.
    refetchInterval: 60_000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => listNotifications({ page: 1, pageSize: 15 }),
    refetchInterval: 60_000,
    enabled: open,
  });

  // Realtime: the server pushes the new unseen count (and the item) over
  // SSE. Write the count straight into the cache so the badge changes
  // without a request, then refresh the list so it is current when opened.
  useNotificationStream((event) => {
    if (event.type !== "count" && event.type !== "notification") return;
    const count = Number(event.data.unseenCount);
    if (Number.isFinite(count)) {
      queryClient.setQueryData(["notifications", "unseen-count"], count);
    }
    if (event.type === "notification") {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      const n = event.data.notification;
      if (n) {
        message.info(
          notificationText({
            id: n.id ?? "",
            type: n.type,
            data: n.data,
            createdAt: n.createdAt,
          } as AppNotification),
        );
      }
    }
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

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
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
    <div className="ops-notif__head">
      <span className="ops-section-title">Notifications</span>
      <Button
        type="link"
        size="small"
        style={{ padding: 0, height: "auto", fontSize: 13 }}
        disabled={unreadItems.length === 0}
        loading={markAllReadMutation.isPending}
        onClick={() => markAllReadMutation.mutate()}
      >
        Mark all as read
      </Button>
    </div>
  );

  const content = (
    <div className="ops-notif__body">
      {isLoading ? (
        <div className="ops-notif__skeleton" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="ops-skeleton" style={{ width: "85%" }} />
              <span className="ops-skeleton" style={{ width: "40%", height: 10 }} />
            </div>
          ))}
        </div>
      ) : !data?.items.length ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No notifications"
          style={{ padding: "28px 16px" }}
        />
      ) : (
        <List
          size="small"
          dataSource={data.items}
          renderItem={(n) => {
            const unread = !n.readAt;
            return (
              <List.Item
                onClick={() => handleClick(n)}
                className={
                  unread ? "ops-notif__item ops-notif__item--unread" : "ops-notif__item"
                }
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
                  avatar={<span className="ops-notif__dot" />}
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
      arrow={false}
      rootClassName="ops-notif-popover"
    >
      <Badge
        count={unseen}
        size="small"
        offset={[-6, 6]}
        styles={{
          indicator: {
            background: COLORS.ink,
            color: COLORS.lime,
            boxShadow: `0 0 0 2px ${COLORS.ground}`,
          },
        }}
      >
        <button type="button" className="ops-icon-btn" aria-label="Notifications">
          <BellOutlined />
        </button>
      </Badge>
    </Popover>
  );
}
