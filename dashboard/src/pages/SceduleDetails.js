import React from "react";
import {
  Card,
  Avatar,
  Button,
  Tag,
  Divider,
  Tooltip,
  Modal,
  Spin,
  List,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
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

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", id],
    queryFn: () => getMatchById(id),
    enabled: !!id,
  });

  if (isLoading || !match)
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );

  const handleCancelBooking = () => setIsCancelModalOpen(true);
  const participants = match.participants || [];

  const fallbackCourt = "/assets/images/placeholder.png";

  return (
    <div className="schedule-details">
      {/* Header */}
      <div className="schedule-header">
        <div className="info">
          <span>
            {t("scheduleDetails.booking_id")}: {match.id.slice(0, 8)} •{" "}
            {match.court?.sport?.toUpperCase() || t("scheduleDetails.court")}
          </span>
          <div className="created">
            <CalendarOutlined /> {dayjs(match.createdAt).fromNow()}
          </div>
        </div>
        <Button danger type="primary" onClick={handleCancelBooking}>
          {t("scheduleDetails.cancel_booking")}
        </Button>
      </div>

      {/* Booking Details */}
      <Card className="schedule-card user-card">
        <h3 className="participants-title">{t("scheduleDetails.details")}</h3>
        <Divider />

        <div className="details-grid">
          <div className="label">
            <CalendarOutlined /> {t("scheduleDetails.date")}
          </div>
          <div>
            {dayjs(match.startDate).format("DD MMMM YYYY")}{" "}
            {dayjs(match.startDate).diff(dayjs(), "day") === 1 && (
              <Tag color="green">{t("scheduleDetails.tomorrow")}</Tag>
            )}
          </div>

          <div className="label">
            <ClockCircleOutlined /> {t("scheduleDetails.time")}
          </div>
          <div>
            {dayjs(match.startDate).format("HH:mm")} -{" "}
            {dayjs(match.endDate).format("HH:mm")}
          </div>

          <div className="label">
            <EnvironmentOutlined /> {t("scheduleDetails.branch")}
          </div>
          <div className="branch-box">
            <span>{match.court?.branch?.name}</span>
            <Tooltip title={t("scheduleDetails.open_branch_page")}>
              <Link to={`/branches/${match.court?.branch?.id}`}>
                <LinkOutlined />
              </Link>
            </Tooltip>
          </div>

          <div className="label">
            <EnvironmentOutlined /> {t("scheduleDetails.court")}
          </div>
          <div className="branch-box">
            <span>{match.court?.name}</span>
            <Tooltip title={t("scheduleDetails.open_court_page")}>
              <Link to={`/courts/${match.court?.id}`}>
                <LinkOutlined />
              </Link>
            </Tooltip>
          </div>

          <div className="label">
            <EnvironmentOutlined /> {t("scheduleDetails.location")}
          </div>
          <div>{match.court?.branch?.location?.address}</div>
        </div>
      </Card>

      {/* Participants */}
      <Card className="schedule-card participants-card">
        <h3 className="participants-title">
          {t("scheduleDetails.participants")}
        </h3>
        <Divider />
        <List
          itemLayout="horizontal"
          dataSource={participants}
          renderItem={(p) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={p.user?.avatarUrl}
                    icon={!p.user?.avatarUrl && <UserOutlined />}
                  />
                }
                title={
                  <span>
                    {p.user?.firstName} {p.user?.lastName}{" "}
                    {p.isCreator && (
                      <Tag color="blue">{t("scheduleDetails.creator")}</Tag>
                    )}
                  </span>
                }
                description={
                  <>
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
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Court Info */}
      <Card className="schedule-card court-card">
        <div className="court-layout">
          <div className="court-image-container">
            <img
              src={match.court?.mainAsset || fallbackCourt}
              alt="Court"
              className="court-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallbackCourt;
              }}
            />
          </div>

          <div className="court-info">
            <h3>
              <Link to={`/courts/${match.court?.id}`}>
                {match.court?.name || t("scheduleDetails.unnamed_court")}
              </Link>
            </h3>
            <div className="rating">⭐ {match.court?.avgRating || 0} / 5</div>
            <div className="surface">
              {t("scheduleDetails.surface")}:{" "}
              {match.court?.surfaceType || "N/A"}
            </div>
            <div className="capacity">
              {t("scheduleDetails.capacity")}: {match.court?.capacity || "N/A"}
            </div>
          </div>

          <div className="payment">
            <div className="label">{t("scheduleDetails.payment")}</div>
            <div className="amount">
              {parseFloat(match.totalAmount).toFixed(2)} SAR
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
        </div>
      </Card>

      {/* Cancel Modal */}
      <Modal
        title={t("scheduleDetails.cancel_confirm_title")}
        open={isCancelModalOpen}
        onOk={async () => {
          try {
            await cancelMatchById(match.id);
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
        <p>{t("scheduleDetails.cancel_warning")}</p>
      </Modal>
    </div>
  );
};

export default ScheduleDetails;
