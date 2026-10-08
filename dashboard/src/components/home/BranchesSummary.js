import React from "react";
import { Button, Empty, Tag } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FALLBACK_IMAGE = "/assets/images/placeholder.png";

const STATUS_COLORS = {
  open: "green",
  closed: "red",
  occupied: "blue",
  maintenance: "orange",
  under_maintenance: "orange",
};

// The API status "under_maintenance" is labelled by branchForm.status_maintenance
const STATUS_LABEL_KEYS = {
  under_maintenance: "maintenance",
};

export default function BranchesSummary({ branches }) {
  const { t } = useTranslation();

  return (
    <section className="cp-card home-card home-branches">
      <div className="cp-section-head">
        <h3 className="cp-section-title">{t("home.branches.title")}</h3>
        {branches.length > 0 && (
          <Link to="/branches" className="cp-link">
            {t("home.branches.viewAll")}
          </Link>
        )}
      </div>

      {branches.length === 0 ? (
        <Empty description={t("home.branches.empty")}>
          <Link to="/branches/add" tabIndex={-1}>
            <Button type="primary">{t("home.branches.emptyCta")}</Button>
          </Link>
        </Empty>
      ) : (
        <ul className="home-list">
          {branches.slice(0, 5).map((branch) => (
            <li key={branch.id}>
              <Link to={`/branches/${branch.id}`} className="cp-list-row">
                <img
                  className="cp-thumb"
                  src={branch.logoUrl || branch.coverUrl || FALLBACK_IMAGE}
                  alt=""
                  loading="lazy"
                />
                <span className="home-list-info">
                  <strong className="cp-truncate">{branch.name}</strong>
                  {branch.location?.address && (
                    <span className="cp-caption cp-truncate">
                      {branch.location.address}
                    </span>
                  )}
                </span>
                <Tag color={STATUS_COLORS[branch.status] || "default"}>
                  {t(
                    `branchForm.status_${
                      STATUS_LABEL_KEYS[branch.status] || branch.status
                    }`,
                    branch.status
                  )}
                </Tag>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
