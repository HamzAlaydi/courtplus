import React from "react";
import { Button, Empty, Skeleton, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCourts } from "../../actions/court_actions";

const FALLBACK_IMAGE = "/assets/images/placeholder.png";
const PANEL_PARAMS = { page: 1, pageSize: 5 };

// Same colours as CourtCard
const STATUS_COLORS = {
  available: "green",
  unavailable: "default",
  pending_payment: "orange",
  pending_approval: "blue",
  changes_requested: "red",
  suspended: "default",
};

const getCover = (assets) =>
  assets?.find((asset) => asset.type === "court_image")?.url || FALLBACK_IMAGE;

export default function CourtsSummary() {
  const { t } = useTranslation();

  // Shares the "all-courts" cache key with the Courts page, so creating or
  // deleting a court refreshes this panel too. No polling: courts change
  // rarely.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["all-courts", PANEL_PARAMS],
    queryFn: () => getCourts(PANEL_PARAMS),
  });

  const courts = data?.items || [];

  return (
    <section className="cp-card home-card home-courts">
      <div className="cp-section-head">
        <h3 className="cp-section-title">{t("courts.title")}</h3>
        {courts.length > 0 && (
          <Link to="/courts" className="cp-link">
            {t("home.branches.viewAll")}
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="home-list-skeleton">
          {[0, 1, 2].map((key) => (
            <Skeleton
              key={key}
              active
              avatar={{ shape: "square", size: 52 }}
              title={{ width: "55%" }}
              paragraph={{ rows: 1, width: "80%" }}
            />
          ))}
        </div>
      ) : isError && !data ? (
        // A failed fetch is not "no courts": keep the card, drop the add CTA
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("court.error_loading")}
        />
      ) : courts.length === 0 ? (
        <Empty description={t("courts.no_courts")}>
          <Link to="/courts/add" tabIndex={-1}>
            <Button type="primary">{t("home.quickActions.addCourt")}</Button>
          </Link>
        </Empty>
      ) : (
        <ul className="home-list">
          {courts.map((court) => (
            <li key={court.id}>
              <Link to={`/courts/${court.id}`} className="cp-list-row">
                <img
                  className="cp-thumb"
                  src={getCover(court.assets)}
                  alt=""
                  loading="lazy"
                />
                <span className="home-list-info">
                  <strong className="cp-truncate">{court.name}</strong>
                  <span className="home-list-meta">
                    {court.isAirConditioned && (
                      <span className="home-feature-chip">
                        {t("courtCard.air_conditioned")}
                      </span>
                    )}
                    {court.isWomenOnly && (
                      <span className="home-feature-chip">
                        {t("courtCard.women_only")}
                      </span>
                    )}
                    <span className="cp-caption cp-num">
                      {[
                        court.sport && t(`courtForm.${court.sport}`, court.sport),
                        court.hourlyRate != null &&
                          `${Number(court.hourlyRate).toLocaleString()} ${t(
                            "home.currency"
                          )}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </span>
                <Tag color={STATUS_COLORS[court.status] || "default"}>
                  {t(`courtCard.status.${court.status}`, court.status)}
                </Tag>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
