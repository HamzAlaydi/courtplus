import React from "react";
import { Link } from "react-router-dom";
import { FiExternalLink } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const CourtCard = ({ name, id, image, status, court }) => {
  const { t } = useTranslation(); // ✅ Translation hook

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
          <span className="dot"></span>
          {t(`courtCard.status.${status}`)}
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

      <Link to={`${id}`} className="court-card-btn" type="text">
        {t("courtCard.open")}
      </Link>
    </div>
  );
};

export default CourtCard;
