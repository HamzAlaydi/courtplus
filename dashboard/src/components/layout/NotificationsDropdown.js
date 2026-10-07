import React, { useState } from "react";
import {
  Badge,
  Button,
  Empty,
  Modal,
  Popover,
  Segmented,
  Select,
  Spin,
  Tooltip,
} from "antd";
import {
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  MessageOutlined,
  StarOutlined,
  TrophyOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
import "dayjs/locale/en";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  markAllNotificationsSeen,
  getUnseenNotificationCount,
} from "../../actions/notifications_action";
import useNotificationStream from "../../hooks/useNotificationStream";
import { useNotification } from "../../modules/NotificationProvider";

dayjs.extend(relativeTime);

const PAGE_SIZE = 10;

// Types a vendor's staff can actually receive, in the order they appear in
// the filter. Customer-only types (follows, posts, invitations) are left out.
const NOTIFICATION_TYPES = [
  "court_pending_approval",
  "court_approved",
  "court_changes_requested",
  "court_resubmitted",
  "court_pending_payment",
  "court_suspended",
  "court_unsuspended",
  "branch_suspended",
  "branch_unsuspended",
  "tenant_suspended",
  "tenant_unsuspended",
  "tenant_unsuspend_requested",
  "subscription_payment_succeeded",
  "subscription_payment_failed",
  "booking_created",
  "booking_cancelled",
  "booking_reminder",
  "review_added",
  "report_created",
];

/**
 * Icon + colour per notification kind, so a glance at the list says what
 * happened before the text is read. Anything unknown falls back to a bell.
 */
function kindMeta(kind = "") {
  if (/(approved|unsuspended|payment_succeeded|refund_succeeded|payment_released)$/.test(kind)) {
    return { icon: <CheckCircleOutlined />, tone: "success" };
  }
  if (/(suspended|changes_requested)$/.test(kind)) {
    return { icon: <WarningOutlined />, tone: "danger" };
  }
  if (/(pending_payment|payment_failed|refund_failed)$/.test(kind)) {
    return { icon: <CreditCardOutlined />, tone: "danger" };
  }
  if (kind.startsWith("subscription_") || kind.startsWith("payment_") || kind.startsWith("refund_")) {
    return { icon: <CreditCardOutlined />, tone: "info" };
  }
  if (kind.startsWith("booking_")) {
    return { icon: <CalendarOutlined />, tone: "info" };
  }
  if (kind === "review_added" || kind === "rate_reminder") {
    return { icon: <StarOutlined />, tone: "warning" };
  }
  if (kind === "report_created") {
    return { icon: <FileTextOutlined />, tone: "danger" };
  }
  if (kind.startsWith("court_") || kind.startsWith("branch_")) {
    return { icon: <TrophyOutlined />, tone: "info" };
  }
  if (kind === "follow") {
    return { icon: <UserOutlined />, tone: "neutral" };
  }
  if (kind.startsWith("moment_") || kind.startsWith("post_")) {
    return { icon: <MessageOutlined />, tone: "neutral" };
  }
  return { icon: <BellOutlined />, tone: "neutral" };
}

// Where a click on a notification should take the vendor.
function getTarget(notif) {
  const data = notif.data || {};
  switch (data.kind) {
    case "court_pending_payment":
    case "subscription_payment_failed":
    case "subscription_payment_succeeded":
      return "/billing";
    case "court_approved":
    case "court_changes_requested":
    case "court_suspended":
    case "court_unsuspended":
    case "court_pending_approval":
    case "court_resubmitted":
      return data.courtId ? `/courts/${data.courtId}` : "/courts";
    case "tenant_suspended":
    case "tenant_unsuspended":
      return "/settings";
    default:
      if (data.bookingId) return "/schedule";
      if (data.branchId) return `/branches/${data.branchId}`;
      if (data.courtId) return `/courts/${data.courtId}`;
      return null;
  }
}

export default function NotificationsDropdown() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const notify = useNotification();
  const isRTL = i18n.language?.startsWith("ar");
  const dayjsLocale = isRTL ? "ar" : "en";

  const [type, setType] = useState(null);
  const [view, setView] = useState("all");
  const [modalData, setModalData] = useState(null);
  const [open, setOpen] = useState(false);

  const { data: unseenData } = useQuery({
    queryKey: ["notifications-unseen"],
    queryFn: getUnseenNotificationCount,
    // Fallback only: the stream below updates the badge the moment a
    // notification is created. Polling covers a dropped stream.
    refetchInterval: 60000,
  });

  // Realtime: the server pushes the new unseen count (and the item) over
  // SSE. Write the count straight into the query cache so the badge changes
  // without a request, then refresh the list so it is current when opened.
  useNotificationStream((event) => {
    if (event.type !== "count" && event.type !== "notification") return;
    const count = Number(event.data?.unseenCount);
    if (Number.isFinite(count)) {
      queryClient.setQueryData(["notifications-unseen"], { count });
    }
    if (event.type === "notification") {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      const kind = event.data?.notification?.type;
      if (kind && notify) {
        notify("info", t(`notifications.types.${kind}`, kind));
      }
    }
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["notifications", type],
    queryFn: ({ pageParam = 1 }) =>
      getNotifications({ page: pageParam, pageSize: PAGE_SIZE, type }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.currentPage < lastPage.pagination.totalPages
        ? lastPage.pagination.currentPage + 1
        : undefined,
    placeholderData: (previousData) => previousData,
    refetchInterval: 60000, // fallback; the stream invalidates on new items
    refetchOnMount: "always",
  });

  const notifications = data?.pages.flatMap((p) => p.items) || [];
  const visible =
    view === "unread" ? notifications.filter((n) => !n.readAt) : notifications;
  const hasUnread = notifications.some((n) => !n.readAt);
  const unseenCount = unseenData?.count || 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unseen"] });
  };

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  });
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });
  const markAllSeenMutation = useMutation({
    mutationFn: markAllNotificationsSeen,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications-unseen"] }),
  });

  // Opening the panel clears the badge (seen); items stay highlighted until
  // they are read.
  const handleOpenChange = (next) => {
    setOpen(next);
    if (next) {
      refetch();
      if (unseenCount > 0) markAllSeenMutation.mutate();
    }
  };

  const handleItemClick = (notif) => {
    if (!notif.readAt) markReadMutation.mutate(notif.id);
    setOpen(false);
    const target = getTarget(notif);
    if (target) navigate(target);
    else setModalData(notif);
  };

  const typeOptions = [
    { value: null, label: t("notifications.all") },
    ...NOTIFICATION_TYPES.map((item) => ({
      value: item,
      label: t(`notifications.types.${item}`, item),
    })),
  ];

  const content = (
    <div className="notifications-dropdown" dir={isRTL ? "rtl" : "ltr"}>
      <div className="nd-header">
        <h4>{t("notifications.title")}</h4>
        <Button
          type="link"
          size="small"
          className="nd-mark-all"
          icon={<CheckOutlined />}
          disabled={!hasUnread}
          loading={markAllReadMutation.isPending}
          onClick={() => markAllReadMutation.mutate()}
        >
          {t("notifications.mark_all_read")}
        </Button>
      </div>

      <div className="nd-filters">
        <Segmented
          size="small"
          value={view}
          onChange={setView}
          options={[
            { value: "all", label: t("notifications.all") },
            { value: "unread", label: t("notifications.unread") },
          ]}
        />
        <Select
          size="small"
          className="nd-type"
          value={type}
          onChange={setType}
          options={typeOptions}
          popupMatchSelectWidth={false}
          getPopupContainer={(node) => node.parentElement}
        />
      </div>

      <div className="nd-scroll">
        {isLoading ? (
          <div className="nd-state">
            <Spin />
          </div>
        ) : visible.length === 0 ? (
          <div className="nd-state">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("notifications.empty")}
            />
          </div>
        ) : (
          <ul className="nd-list">
            {visible.map((notif) => {
              const meta = kindMeta(notif.data?.kind || notif.type);
              const unread = !notif.readAt;
              return (
                <li
                  key={notif.id}
                  className={`nd-item${unread ? " is-unread" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleItemClick(notif)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleItemClick(notif);
                  }}
                >
                  <span className={`nd-icon tone-${meta.tone}`}>{meta.icon}</span>
                  <div className="nd-body">
                    <div className="nd-row">
                      <span className="nd-title">{notif.title}</span>
                      <time
                        className="nd-time"
                        dateTime={notif.createdAt}
                        title={new Date(notif.createdAt).toLocaleString()}
                      >
                        {dayjs(notif.createdAt).locale(dayjsLocale).fromNow()}
                      </time>
                    </div>
                    {notif.content && <p className="nd-text">{notif.content}</p>}
                  </div>
                  {unread && (
                    <Tooltip title={t("notifications.mark_read")}>
                      <button
                        type="button"
                        className="nd-read-btn"
                        aria-label={t("notifications.mark_read")}
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(notif.id);
                        }}
                      >
                        <CheckOutlined />
                      </button>
                    </Tooltip>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {hasNextPage && visible.length > 0 && (
          <Button
            block
            type="text"
            size="small"
            className="nd-load-more"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            {t("notifications.load_more")}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Popover
        content={content}
        trigger="click"
        open={open}
        onOpenChange={handleOpenChange}
        placement="bottomRight"
        arrow={false}
        overlayClassName="notifications-popover"
        // Narrow viewports: the bell sits near the right edge and a
        // right-anchored 400px panel ran off the left of the screen. Let the
        // popup shift horizontally to stay in view instead of flipping.
        align={{ overflow: { adjustX: true, adjustY: true, shiftX: true, shiftY: true } }}
      >
        <button
          type="button"
          className="notif-trigger"
          aria-label={t("notifications.title")}
        >
          <Badge count={unseenCount} size="small" overflowCount={99}>
            <BellOutlined className="notif-icon" />
          </Badge>
        </button>
      </Popover>

      <Modal
        open={!!modalData}
        title={modalData?.title}
        onCancel={() => setModalData(null)}
        footer={null}
      >
        <p>{modalData?.content}</p>
        <div style={{ fontSize: 12, color: "#777" }}>
          {modalData?.createdAt && new Date(modalData.createdAt).toLocaleString()}
        </div>
      </Modal>
    </>
  );
}
