import { useState } from "react";
import { Button, Tabs, Rate, Alert, Spin, Flex, Tag } from "antd";
import { Link, useParams } from "react-router-dom";
import { BiEdit } from "react-icons/bi";
import {
  IoLocationOutline,
  IoSnowOutline,
  IoWomanOutline,
} from "react-icons/io5";
import { getCourt } from "../actions/court_actions";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import CourtMediaGallery from "../components/court/CourtMediaGallery";
import ReviewsTab from "../components/court/ReviewsTab";
import BookingTab from "../components/court/BookingTab";
import PostsTab from "../components/court/PostsTab";

// Same colors as CourtCard
const STATUS_COLORS = {
  available: "green",
  unavailable: "default",
  pending_payment: "orange",
  pending_approval: "blue",
  changes_requested: "red",
  suspended: "default",
};

export default function Court() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("details");

  const {
    data: court,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["court", id],
    queryFn: () => getCourt(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="content court-page court-page--state">
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    console.error("Error fetching court data:", error);
    return (
      <div className="content">
        <Alert message={t("court.error_loading")} type="error" showIcon />
      </div>
    );
  }

  const getImages = (assets) => {
    const imageAssets = assets?.filter((a) => a.type === "court_image");
    return imageAssets?.length ? imageAssets.map((a) => a.url) : [];
  };

  const getVideo = (assets) =>
    assets?.find((a) => a.type === "court_video")?.url;

  const images = getImages(court?.assets);
  const video = getVideo(court?.assets);
  const hasMedia = images.length > 0 || !!video;

  const tabItems = [
    {
      key: "details",
      label: t("court.tabs.details"),
      content: (
        <div className="court-info">
          <div className="info-item">
            <span>{t("court.sport")}</span>
            <strong>
              {court?.sport
                ? t(`courtForm.${court.sport}`, court.sport)
                : t("court.not_specified")}
            </strong>
          </div>
          <div className="info-item">
            <span>{t("court.surface")}</span>
            <strong>{t(`court.surface_${court?.surface}`)}</strong>
          </div>
          <div className="info-item">
            <span>{t("court.air_conditioned")}</span>
            <strong>
              {court?.isAirConditioned
                ? t("court.air_conditioned_yes")
                : t("court.air_conditioned_no")}
            </strong>
          </div>
          <div className="info-item">
            <span>{t("court.women_only")}</span>
            <strong>
              {court?.isWomenOnly
                ? t("court.women_only_yes")
                : t("court.women_only_no")}
            </strong>
          </div>
          <div className="info-item">
            <span>{t("court.size")}</span>
            <strong>{t(`court.size_${court?.size}`)}</strong>
          </div>
          <div className="info-item">
            <span>{t("court.length")}</span>
            <strong>
              {court?.length} {t("court.meters")}
            </strong>
          </div>
          <div className="info-item">
            <span>{t("court.width")}</span>
            <strong>
              {court?.width} {t("court.meters")}
            </strong>
          </div>
          <div className="info-item">
            <span>{t("court.hourly_rate")}</span>
            <strong>
              {court?.hourlyRate} {t("home.currency")}
            </strong>
          </div>
          <div className="info-item">
            <span>{t("court.location")}</span>
            <strong>
              {court?.location?.name || t("court.unknown_location")}
            </strong>
          </div>
          {court?.branch && (
            <Link
              to={`/branches/${court.branch.id}`}
              className="info-item info-item--link"
            >
              <span>{t("court.branch")}</span>
              <strong>{court.branch.name}</strong>
            </Link>
          )}
        </div>
      ),
    },
    {
      key: "booking",
      label: t("court.tabs.booking"),
      content: <BookingTab courtId={court?.id} />,
    },
    {
      key: "reviews",
      label: t("court.tabs.reviews"),
      content: <ReviewsTab courtId={court?.id} />,
    },
    {
      key: "moments",
      label: t("court.tabs.moments"),
      content: <PostsTab courtId={court?.id} />,
    },
  ];

  return (
    <div className="content court-page">
      {/* Ops decision + reason: the notification links here, but the page
          showed neither the status nor why changes were requested. */}
      {court?.status && ["changes_requested", "suspended", "pending_approval", "pending_payment"].includes(court.status) && (
        <Alert
          type={["changes_requested", "suspended"].includes(court.status) ? "warning" : "info"}
          showIcon
          message={t(`courtCard.status.${court.status}`, court.status)}
          description={court.rejectionReason ? `${t("courtCard.rejection_reason")}: ${court.rejectionReason}` : undefined}
        />
      )}
      <div className="content-header">
        <h4>{t("court.title")}</h4>
        <Link to="edit" tabIndex={-1}>
          <Button type="primary" icon={<BiEdit />}>
            {t("court.edit")}
          </Button>
        </Link>
      </div>

      <div className={`court${hasMedia ? "" : " court--no-media"}`}>
        <div className="court-hero">
          {hasMedia && (
            <div className="court-header">
              <CourtMediaGallery images={images} video={video} />
            </div>
          )}

          <section className="cp-card court-summary">
            <div className="court-title">
              <h2>{court?.name || t("court.untitled")}</h2>
              <div className="court-meta">
                {court?.branch && (
                  <Link
                    to={`/branches/${court.branch.id}`}
                    className="court-meta-item court-meta-link"
                  >
                    <IoLocationOutline />
                    {court.branch.name}
                  </Link>
                )}
                {court?.location?.name && (
                  <span className="court-meta-item">
                    {court.location.name}
                  </span>
                )}
              </div>
            </div>

            <Flex gap="small" align="center" wrap className="court-rating">
              <Rate allowHalf defaultValue={court?.avgRating || 0} disabled />
              <span className="court-rating-value">
                {court?.avgRating?.toFixed?.(1) || "0.0"}
              </span>
              {court?.reviewsCount != null && (
                <span className="court-rating-count">
                  · {court.reviewsCount} {t("court.tabs.reviews")}
                </span>
              )}
            </Flex>

            <div className="court-chips">
              {court?.status && (
                <Tag color={STATUS_COLORS[court.status] || "default"}>
                  {t(`courtCard.status.${court.status}`, court.status)}
                </Tag>
              )}
              {court?.sport && (
                <span className="court-chip">
                  {t(`courtForm.${court.sport}`, court.sport)}
                </span>
              )}
              {court?.surface && (
                <span className="court-chip">
                  {t(`court.surface_${court.surface}`)}
                </span>
              )}
              {court?.size && (
                <span className="court-chip">
                  {t(`court.size_${court.size}`)}
                </span>
              )}
              {court?.isAirConditioned && (
                <span className="court-chip court-chip--feature">
                  <IoSnowOutline />
                  {t("courtCard.air_conditioned")}
                </span>
              )}
              {court?.isWomenOnly && (
                <span className="court-chip court-chip--feature">
                  <IoWomanOutline />
                  {t("courtCard.women_only")}
                </span>
              )}
            </div>

            <div className="court-price">
              <span className="court-price-label">{t("court.hourly_rate")}</span>
              <span className="court-price-value">
                {court?.hourlyRate ?? 0}
                <span className="court-price-unit">{t("home.currency")}</span>
              </span>
            </div>
          </section>
        </div>

        <div className="cp-card court-tabs-card">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="court-tabs"
            items={tabItems.map((tab) => ({
              key: tab.key,
              label: tab.label,
              children: tab.content,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
