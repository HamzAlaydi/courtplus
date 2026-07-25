import React from "react";
import { Link } from "react-router-dom";
import { FiExternalLink } from "react-icons/fi";
import { MdDeleteOutline } from "react-icons/md";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Popconfirm, Popover, Tag } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { deleteCourt } from "../actions/court_actions";
import { useNotification } from "../modules/NotificationProvider";

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
      notify(
        "error",
        err?.response?.data?.code || t("courtCard.delete_failed")
      );
    },
  });

  const showReason =
    (status === "changes_requested" || status === "suspended") &&
    court?.rejectionReason;

  return (
    <div className="court-card">
      {/* Court Image */}

      <img className="court-image" src={image} alt=" Court" />

      {/* Court Info */}
      <div className="court-info">
        <h4>
          {name} <br /> {t("courtCard.label")}
        </h4>
        <div className="rating">
          ⭐ {court?.avgRating?.toFixed?.(1) ?? "0.0"}
        </div>
        <div className="status">
          <Tag color={STATUS_COLORS[status] || "default"}>
            {t(`courtCard.status.${status}`, status)}
          </Tag>
          {showReason && (
            <Popover
              content={court.rejectionReason}
              title={t("courtCard.rejection_reason")}
            >
              <InfoCircleOutlined className="status-info-icon" />
            </Popover>
          )}
        </div>
      </div>

      {/* Court Stats */}
      <div className="court-stats">
        <div className="stat">
          <span>{t("courtCard.income_month")}</span>
          <h3>
            {court?.totalRevenue?.toLocaleString() ?? 0} <span>SAR</span>
          </h3>
        </div>

        <div className="stat">
          <span>{t("courtCard.occupation_month")}</span>
          <h3>{court?.minutesBooked?.toLocaleString() ?? 0}</h3>
        </div>

        {/* Reviews */}
        <div className="reviews">
          <span>{t("courtCard.recent_reviews")}</span>
          <h3>{court?.reviewsCount ?? 0}</h3>
        </div>

        <div className="stat">
          <span>{t("courtCard.upcoming_matches")}</span>
          <h3>{court?.upcomingBookings ?? 0}</h3>
        </div>
      </div>

      <Link className="court-card-link">
        <FiExternalLink color="#777" size={24} />
      </Link>

      <div className="court-card-actions">
        <Link to={`${id}`} className="court-card-btn" type="text">
          {t("courtCard.open")}
        </Link>
        {status === "changes_requested" ? (
          <Link to={`${id}/edit`} className="court-card-btn">
            {t("courtCard.resubmit")}
          </Link>
        ) : (
          <Link to={`${id}/edit`} className="court-card-btn" type="text">
            {t("courtCard.edit")}
          </Link>
        )}
        <Popconfirm
          title={t("courtCard.delete_confirm")}
          okText={t("common.delete")}
          cancelText={t("common.cancel")}
          onConfirm={() => deleteCourtMutate()}
        >
          <button type="button" className="court-card-delete">
            <MdDeleteOutline size={20} />
          </button>
        </Popconfirm>
      </div>
    </div>
  );
};

export default CourtCard;
