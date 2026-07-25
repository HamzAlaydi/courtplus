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
  "refund_processed",
  "booking_join_request_submitted",
  "booking_join_request_approved",
  "booking_join_request_rejected",
];

export default function NotificationsDropdown() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [type, setType] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: unseenData } = useQuery({
    queryKey: ["notifications-unseen"],
    queryFn: getUnseenNotificationCount,
  });

  // 🚀 Infinite Query
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["notifications", type],
      queryFn: ({ pageParam = 1 }) =>
        getNotifications({ page: pageParam, pageSize: PAGE_SIZE, type }),

      getNextPageParam: (lastPage) => {
        if (lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
          return lastPage.pagination.currentPage + 1;
        }
        return undefined;
      },
      keepPreviousData: true,
    });

  //   const unseenCount = unseenData?.count || 0;

  // Flatten all pages → one clean array
  const notifications = data?.pages.flatMap((p) => p.items) || [];

  const unreadCount = unseenData?.count || 0;

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const markAllSeenMutation = useMutation({
    mutationFn: markAllNotificationsSeen,
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  // 🔹 Map notification data.kind → in-app destination
  const getTarget = (notif) => {
    const data = notif.data || {};
    switch (data.kind) {
      case "court_payment_pending":
        return "/billing";
      case "court_approved":
      case "changes_requested":
      case "suspended":
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
            loading={markAllSeenMutation.isLoading}
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
              {item || "All"}
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
        onOpenChange={setDropdownOpen}
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
