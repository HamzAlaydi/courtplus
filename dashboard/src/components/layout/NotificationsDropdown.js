import React, { useState } from "react";
import {
  Dropdown,
  List,
  Badge,
  Spin,
  Button,
  Select,
  Empty,
  Modal,
} from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsSeen,
  getUnseenNotificationCount,
} from "../../actions/notifications_action";

const PAGE_SIZE = 10;

const NOTIFICATION_TYPES = [
  null,
  "follow",
  "review_added",
  "booking_cancelled",
  "booking_invitation_accepted",
  "booking_invitation_rejected",
  "booking_reminder",
  "booking_invitation",
  "booking_entered",
  "booking_joined",
  "booking_created",
  "moment_posted",
  "post_like",
  "report_created",
  "payment_failed",
  "payment_succeeded",
  "booking_join_request_submitted",
  "booking_join_request_approved",
  "booking_join_request_rejected",
  "court_pending_payment",
  "court_pending_approval",
  "court_approved",
  "court_changes_requested",
  "court_resubmitted",
  "court_suspended",
  "court_unsuspended",
  "branch_suspended",
  "branch_unsuspended",
  "tenant_suspended",
  "tenant_unsuspended",
  "tenant_unsuspend_requested",
  "subscription_payment_failed",
];

export default function NotificationsDropdown() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [type, setType] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: unseenData } = useQuery({
    queryKey: ["notifications-unseen"],
    queryFn: getUnseenNotificationCount,
    refetchInterval: 30000,
  });

  // 🚀 Infinite Query
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
      getNextPageParam: (lastPage) => {
        if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
          return lastPage.pagination.currentPage + 1;
        }
        return undefined;
      },
      placeholderData: (previousData) => previousData,
      refetchInterval: 30000, // live-update the list like the badge
      refetchOnMount: "always", // fresh list every time the dropdown mounts/opens
    });

  //   const unseenCount = unseenData?.count || 0;

  // Flatten all pages → one clean array
  const notifications = data?.pages.flatMap((p) => p.items) || [];

  const unreadCount = unseenData?.count || 0;

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unseen"] });
    },
  });

  const markAllSeenMutation = useMutation({
    mutationFn: markAllNotificationsSeen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unseen"] });
    },
  });

  // 🔹 Map notification data.kind → in-app destination
  const getTarget = (notif) => {
    const data = notif.data || {};
    switch (data.kind) {
      case "court_pending_payment":
      case "subscription_payment_failed":
        return "/billing";
      case "court_approved":
      case "court_changes_requested":
      case "court_suspended":
        return data.courtId ? `/courts/${data.courtId}` : "/courts";
      default:
        if (data.branchId) return `/branches/${data.branchId}`;
        if (data.courtId) return `/courts/${data.courtId}`;
        return null;
    }
  };

  const handleMarkRead = (notif) => {
    markReadMutation.mutate(notif.id);
    setDropdownOpen(false); // CLOSE DROPDOWN ⭐

    const target = getTarget(notif);
    if (target) {
      navigate(target);
    } else {
      setModalData(notif); // OPEN MODAL (no destination)
    }
  };

  // Opening the dropdown marks everything seen → badge clears on invalidation
  const handleOpenChange = (open) => {
    setDropdownOpen(open);
    if (open) {
      refetch(); // fresh list every time the dropdown opens
      if (unreadCount > 0) {
        markAllSeenMutation.mutate();
      }
    }
  };

  const dropdownContent = (
    <div className="notifications-dropdown">
      {/* Header */}
      <div className="header">
        <h4>Notifications</h4>

        {unreadCount > 0 && (
          <Button
            size="small"
            type="default"
            className="btn-mark-all"
            onClick={() => markAllSeenMutation.mutate()}
            loading={markAllSeenMutation.isPending}
          >
            Mark all
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="filter-row">
        <Select
          value={type}
          onChange={(v) => {
            setType(v);
          }}
          size="small"
          className="filter-dropdown"
        >
          {NOTIFICATION_TYPES.map((item) => (
            <Select.Option key={item} value={item}>
              {item ? t(`notifications.types.${item}`, item) : t("notifications.all")}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Scrollable Content */}
      <div className="scroll-area">
        {isLoading ? (
          <div className="loading">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty description="No notifications" style={{ margin: "20px 0" }} />
        ) : (
          <List
            className="notification-list"
            dataSource={notifications}
            renderItem={(notif) => (
              <List.Item
                className={!notif.readAt ? "unread" : ""}
                onClick={() => handleMarkRead(notif)}
              >
                <div className="item-content">
                  <div className="title">{notif.title}</div>
                  <div className="content">{notif.content}</div>
                  <div className="time">
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}

        {/* Load More */}
        {hasNextPage && (
          <Button
            block
            size="small"
            className="btn-load-more"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Dropdown trigger */}
      <Dropdown
        overlay={dropdownContent}
        trigger={["click"]}
        placement="bottomRight"
        open={dropdownOpen}
        onOpenChange={handleOpenChange}
      >
        <Badge count={unreadCount} size="small">
          <BellOutlined className="notif-icon" />
        </Badge>
      </Dropdown>

      {/* Modal for notification details */}
      <Modal
        open={!!modalData}
        title={modalData?.title}
        onCancel={() => setModalData(null)}
        footer={null}
      >
        <p>{modalData?.content}</p>
        <div style={{ fontSize: 12, color: "#777" }}>
          {modalData?.createdAt &&
            new Date(modalData.createdAt).toLocaleString()}
        </div>
      </Modal>
    </>
  );
}
