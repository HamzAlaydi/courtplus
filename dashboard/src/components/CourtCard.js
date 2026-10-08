import React from "react";
import { Link } from "react-router-dom";
import { MdDeleteOutline } from "react-icons/md";
import {
  IoLocationOutline,
  IoSnowOutline,
  IoStar,
  IoWomanOutline,
} from "react-icons/io5";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Popconfirm, Popover, Tag } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { deleteCourt } from "../actions/court_actions";
import { useNotification } from "../modules/NotificationProvider";
import { notifyError } from "../utils/errorMessages";

const FALLBACK_IMAGE = "/assets/images/placeholder.png";

const STATUS_COLORS = {
  available: "green",
  unavailable: "default",
  pending_payment: "orange",
  pending_approval: "blue",
  changes_requested: "red",
  suspended: "default",
};

const CourtCard = ({ name, id, image, status, court }) => {
  const { t } = useTranslation(); // ✅ Translation hook
  const notify = useNotification();
  const queryClient = useQueryClient();

  const { mutate: deleteCourtMutate } = useMutation({
    mutationFn: () => deleteCourt(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["all-courts"]);
      notify("success", t("courtCard.delete_success"));
    },
    onError: (err) => {
      notifyError(notify, err, t, "courtCard.delete_failed");
    },
  });

  const showReason =
    (status === "changes_requested" || status === "suspended") &&
    court?.rejectionReason;

  const hasFeatures = court?.isAirConditioned || court?.isWomenOnly;
  const branchName = court?.branch?.name;
  const hourlyRate = court?.hourlyRate;

  const stats = [
    {
      id: "income",
      label: t("courtCard.income_month"),
      value: court?.totalRevenue?.toLocaleString() ?? 0,
      unit: t("home.currency"),
    },
    {
      id: "minutes",
      label: t("courtCard.occupation_month"),
      value: court?.minutesBooked?.toLocaleString() ?? 0,
    },
    {
      id: "reviews",
      label: t("courtCard.recent_reviews"),
      value: court?.reviewsCount ?? 0,
    },
    {
      id: "upcoming",
      label: t("courtCard.upcoming_matches"),
      value: court?.upcomingBookings ?? 0,
    },
  ];

  return (
    <article className="court-card">
      {/* Court Image */}
      <div className="court-card-media">
        <Link
          to={`/courts/${id}`}
          className="court-card-media-link"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            className="court-image"
            src={image || FALLBACK_IMAGE}
            alt=""
            loading="lazy"
          />
        </Link>

        <span className="court-card-rating">
          <IoStar className="court-card-star" />
          {court?.avgRating?.toFixed?.(1) ?? "0.0"}
        </span>

        {hasFeatures && (
          <div className="court-card-features">
            {court?.isAirConditioned && (
              <span className="court-card-feature">
                <IoSnowOutline />
                {t("courtCard.air_conditioned")}
              </span>
            )}
            {court?.isWomenOnly && (
              <span className="court-card-feature">
                <IoWomanOutline />
                {t("courtCard.women_only")}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Court Info */}
      <div className="court-card-body">
        <div className="court-info">
          <div className="court-card-titles">
            <h4 className="court-card-name">{name}</h4>
            <span className="court-card-label">{t("courtCard.label")}</span>
            {branchName && (
              <span className="court-card-branch">
                <IoLocationOutline />
                <span className="cp-truncate">{branchName}</span>
              </span>
            )}
          </div>
          {hourlyRate != null && (
            <span className="court-card-price" title={t("court.hourly_rate")}>
              {Number(hourlyRate).toLocaleString()}
              <span className="court-card-price-unit">
                {t("home.currency")}
              </span>
            </span>
          )}
        </div>

        <div className="status">
          <Tag color={STATUS_COLORS[status] || "default"}>
            {t(`courtCard.status.${status}`, status)}
          </Tag>
          {court?.sport && (
            <Tag className="court-card-sport">
              {t(`courtForm.${court.sport}`, court.sport)}
            </Tag>
          )}
          {showReason && (
            <Popover
              content={court.rejectionReason}
              title={t("courtCard.rejection_reason")}
            >
              <button
                type="button"
                className="status-info-icon"
                aria-label={t("courtCard.rejection_reason")}
              >
                <InfoCircleOutlined />
              </button>
            </Popover>
          )}
        </div>

        {/* Court Stats */}
        <dl className="court-stats">
          {stats.map((stat) => (
            <div className="stat" key={stat.id}>
              <dt>{stat.label}</dt>
              <dd>
                {stat.value}
                {stat.unit && <span>{stat.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>

        <div className="court-card-actions">
          <Link
            to={`/courts/${id}`}
            className="court-card-btn court-card-btn--primary"
          >
            {t("courtCard.open")}
          </Link>
          {status === "changes_requested" ? (
            <Link
              to={`/courts/${id}/edit`}
              className="court-card-btn court-card-btn--ink"
            >
              {t("courtCard.resubmit")}
            </Link>
          ) : (
            <Link to={`/courts/${id}/edit`} className="court-card-btn">
              {t("courtCard.edit")}
            </Link>
          )}
          <Popconfirm
            title={t("courtCard.delete_confirm")}
            okText={t("common.delete")}
            cancelText={t("common.cancel")}
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteCourtMutate()}
          >
            <button
              type="button"
              className="court-card-delete"
              aria-label={t("common.delete")}
            >
              <MdDeleteOutline size={20} />
            </button>
          </Popconfirm>
        </div>
      </div>
    </article>
  );
};

export default CourtCard;
