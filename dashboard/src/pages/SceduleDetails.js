import React from "react";
import {
  Card,
  Avatar,
  Button,
  Tag,
  Tooltip,
  Modal,
  Skeleton,
  List,
  Input,
} from "antd";
import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  StarFilled,
  UserOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cancelMatchById, getMatchById } from "../actions/match_actions";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNotification } from "../modules/NotificationProvider";
import { useTranslation } from "react-i18next";

dayjs.extend(relativeTime);

const ScheduleDetails = () => {
  const { id } = useParams();
  const notify = useNotification();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  // Sent with the cancellation so the customer's notification and the
  // booking record say why; it was not collected at all before.
  const [cancelReason, setCancelReason] = React.useState("");

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", id],
    queryFn: () => getMatchById(id),
    enabled: !!id,
  });

  if (isLoading || !match)
    return (
      <div className="content schedule-details">
        <div className="schedule-details-grid">
          <div className="cp-card">
            <Skeleton active paragraph={{ rows: 7 }} />
          </div>
          <div className="cp-card">
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        </div>
      </div>
    );

  const handleCancelBooking = () => setIsCancelModalOpen(true);
  const participants = match.participants || [];

  const fallbackCourt = "/assets/images/placeholder.png";

  return (
    <div className="content schedule-details">
      {/* Header */}
      <div className="schedule-details-head">
        <div className="schedule-details-heading">
          <div className="schedule-details-title-row">
            <h2 className="schedule-details-title">
              {t("scheduleDetails.booking_id")}:{" "}
              <span className="schedule-details-id">{match.id.slice(0, 8)}</span>
            </h2>
            <span className="cp-pill cp-pill--outline">
              {match.court?.sport?.toUpperCase() || t("scheduleDetails.court")}
            </span>
          </div>
          <div className="created">
            <CalendarOutlined /> {dayjs(match.createdAt).fromNow()}
          </div>
        </div>
        <Button danger onClick={handleCancelBooking}>
          {t("scheduleDetails.cancel_booking")}
        </Button>
      </div>

      <div className="schedule-details-grid">
        <div className="schedule-details-main cp-stagger">
          {/* Booking Details */}
          <Card
            title={t("scheduleDetails.details")}
            className="schedule-card user-card"
          >
            <dl className="details-grid">
              <dt className="label">
                <CalendarOutlined /> {t("scheduleDetails.date")}
              </dt>
              <dd className="value">
                {dayjs(match.startDate).format("DD MMMM YYYY")}{" "}
                {dayjs(match.startDate).diff(dayjs(), "day") === 1 && (
                  <Tag color="green">{t("scheduleDetails.tomorrow")}</Tag>
                )}
              </dd>

              <dt className="label">
                <ClockCircleOutlined /> {t("scheduleDetails.time")}
              </dt>
              <dd className="value cp-num">
                {dayjs(match.startDate).format("HH:mm")} -{" "}
                {dayjs(match.endDate).format("HH:mm")}
              </dd>

              <dt className="label">
                <ShopOutlined /> {t("scheduleDetails.branch")}
              </dt>
              <dd className="value branch-box">
                <span>{match.court?.branch?.name}</span>
                <Tooltip title={t("scheduleDetails.open_branch_page")}>
                  <Link
                    className="details-open"
                    to={`/branches/${match.court?.branch?.id}`}
                    aria-label={t("scheduleDetails.open_branch_page")}
                  >
                    <LinkOutlined />
                  </Link>
                </Tooltip>
              </dd>

              <dt className="label">
                <AppstoreOutlined /> {t("scheduleDetails.court")}
              </dt>
              <dd className="value branch-box">
                <span>{match.court?.name}</span>
                <Tooltip title={t("scheduleDetails.open_court_page")}>
                  <Link
                    className="details-open"
                    to={`/courts/${match.court?.id}`}
                    aria-label={t("scheduleDetails.open_court_page")}
                  >
                    <LinkOutlined />
                  </Link>
                </Tooltip>
              </dd>

              <dt className="label">
                <EnvironmentOutlined /> {t("scheduleDetails.location")}
              </dt>
              <dd className="value">{match.court?.branch?.location?.address}</dd>
            </dl>
          </Card>

          {/* Participants */}
          <Card
            title={t("scheduleDetails.participants")}
            extra={
              <span className="cp-pill cp-pill--neutral cp-num">
                {participants.length}
              </span>
            }
            className="schedule-card participants-card"
          >
            <List
              itemLayout="horizontal"
              dataSource={participants}
              renderItem={(p) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={40}
                        className="participant-avatar"
                        src={p.user?.avatarUrl}
                        icon={!p.user?.avatarUrl && <UserOutlined />}
                      />
                    }
                    title={
                      <span className="participant-name">
                        {p.user?.firstName} {p.user?.lastName}{" "}
                        {p.isCreator && (
                          <Tag color="lime">{t("scheduleDetails.creator")}</Tag>
                        )}
                      </span>
                    }
                    description={
                      <span className="participant-meta">
                        @{p.user?.username || "unknown"}{" "}
                        <Tag
                          color={
                            p.status === "ready" || p.status === "entered"
                              ? "green"
                              : p.status?.startsWith("pending")
                              ? "orange"
                              : "red"
                          }
                        >
                          {t(`scheduleDetails.status.${p.status}`)}
                        </Tag>
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>

        <aside className="schedule-details-aside cp-stagger">
          {/* Court Info */}
          <Card
            className="schedule-card booking-court-card"
            cover={
              <img
                src={match.court?.mainAsset || fallbackCourt}
                alt="Court"
                className="court-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = fallbackCourt;
                }}
              />
            }
          >
            <div className="court-info">
              <h3>
                <Link to={`/courts/${match.court?.id}`}>
                  {match.court?.name || t("scheduleDetails.unnamed_court")}
                </Link>
              </h3>
              <div className="rating">
                <StarFilled className="rating-star" />{" "}
                {match.court?.avgRating || 0} / 5
              </div>
              {/* The court model has `surface` and `size`; the previous
                  `surfaceType`/`capacity` never existed, so both read N/A. */}
              <dl className="court-facts">
                <dt>{t("scheduleDetails.surface")}</dt>
                <dd className="surface">
                  {match.court?.surface
                    ? t(`courtForm.surface_${match.court.surface}`, match.court.surface)
                    : "N/A"}
                </dd>
                <dt>{t("scheduleDetails.capacity")}</dt>
                <dd className="capacity">
                  {match.playersASide
                    ? `${match.playersASide} vs ${match.playersASide}`
                    : match.court?.size
                      ? t(`courtForm.size_${match.court.size}`, match.court.size)
                      : "N/A"}
                </dd>
              </dl>
            </div>
          </Card>

          {/* Payment */}
          <div className="cp-card cp-card--ink payment">
            <div className="label">{t("scheduleDetails.payment")}</div>
            <div className="amount">
              {parseFloat(match.totalAmount).toFixed(2)}
              <span className="amount-unit">{t("home.currency")}</span>
            </div>
            <div
              className={`status ${
                ["pending", "partially_paid", "hold"].includes(
                  match.paymentStatus,
                )
                  ? "pending"
                  : "paid"
              }`}
            >
              {t(`scheduleDetails.payment_status.${match.paymentStatus}`)}
            </div>
          </div>
        </aside>
      </div>

      {/* Cancel Modal */}
      <Modal
        className="schedule-cancel-modal"
        title={t("scheduleDetails.cancel_confirm_title")}
        open={isCancelModalOpen}
        onOk={async () => {
          try {
            await cancelMatchById(match.id, cancelReason.trim());
            notify("success", t("scheduleDetails.cancel_success"));
            navigate("/schedule");
          } catch (error) {
            console.error(error);
            notify("error", t("scheduleDetails.cancel_fail"));
          } finally {
            setIsCancelModalOpen(false);
          }
        }}
        onCancel={() => setIsCancelModalOpen(false)}
        okText={t("scheduleDetails.yes_cancel")}
        cancelText={t("scheduleDetails.no")}
        okButtonProps={{ danger: true }}
      >
        <p className="schedule-cancel-warning">
          {t("scheduleDetails.cancel_warning")}
        </p>
        <Input.TextArea
          rows={3}
          maxLength={500}
          showCount
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder={t("scheduleDetails.cancel_reason_placeholder")}
        />
      </Modal>
    </div>
  );
};

export default ScheduleDetails;
