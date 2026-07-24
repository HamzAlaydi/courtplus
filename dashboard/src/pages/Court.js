import { useState } from "react";
import { Button, Tabs, Rate, Alert, Spin, Flex } from "antd";
import { Link, useParams } from "react-router-dom";
import { BiEdit } from "react-icons/bi";
import { getCourt } from "../actions/court_actions";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import CourtCarousel from "../components/CourtCarousel";
import ReviewsTab from "../components/court/ReviewsTab";
import BookingTab from "../components/court/BookingTab";
import PostsTab from "../components/court/PostsTab";

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
      <div className="content">
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

  const tabItems = [
    {
      key: "details",
      label: t("court.tabs.details"),
      content: (
        <div className="court-info">
          <h5 className="info-item">
            <span>{t("court.sport")}</span>
            <strong>{court?.sport || t("court.not_specified")}</strong>
          </h5>
          <h5 className="info-item">
            <span>{t("court.surface")}</span>
            <strong>{t(`court.surface_${court?.surface}`)}</strong>
          </h5>
          <h5 className="info-item">
            <span>{t("court.size")}</span>
            <strong>{t(`court.size_${court?.size}`)}</strong>
          </h5>
          <h5 className="info-item">
            <span>{t("court.length")}</span>
            <strong>
              {court?.length} {t("court.meters")}
            </strong>
          </h5>
          <h5 className="info-item">
            <span>{t("court.width")}</span>
            <strong>
              {court?.width} {t("court.meters")}
            </strong>
          </h5>
          <h5 className="info-item">
            <span>{t("court.hourly_rate")}</span>
            <strong>{court?.hourlyRate} SAR</strong>
          </h5>
          <h5 className="info-item">
            <span>{t("court.location")}</span>
            <strong>
              {court?.location?.name || t("court.unknown_location")}
            </strong>
          </h5>
          {court?.branch && (
            <h5>
              <Link to={`/branches/${court.branch.id}`} className="info-item">
                <span>{t("court.branch")}</span>
                <strong>{court.branch.name}</strong>
              </Link>
            </h5>
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
    <div className="content">
      <div className="content-header">
        <h4>{t("court.title")}</h4>
        <Link to="edit">
          <Button type="primary">
            <BiEdit /> {t("court.edit")}
          </Button>
        </Link>
      </div>

      <div className="court">
        <div className="court-header">
          {court?.assets?.length > 0 && (
            <CourtCarousel
              images={getImages(court.assets)}
              centerSlideScale={1.2}
            />
          )}
        </div>

        <div className="court-title">
          <h2>{court?.name || t("court.untitled")}</h2>
          <Flex gap="small" align="center">
            <Rate allowHalf defaultValue={court?.avgRating || 0} disabled />
            <span>{court?.avgRating?.toFixed?.(1) || "0.0"}</span>
          </Flex>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="court-tabs"
        >
          {tabItems.map((tab) => (
            <Tabs.TabPane tab={tab.label} key={tab.key}>
              {tab.content}
            </Tabs.TabPane>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
