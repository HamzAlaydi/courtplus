import React from "react";
import { Button, Empty, Tag } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const STATUS_COLORS = {
  open: "green",
  closed: "red",
  occupied: "blue",
  maintenance: "orange",
};

export default function BranchesSummary({ branches }) {
  const { t } = useTranslation();

  return (
    <div className="home-card home-branches">
      <div className="home-card-header">
        <h4 className="home-card-title">{t("home.branches.title")}</h4>
        {branches.length > 0 && (
          <Link to="/branches" className="home-card-link">
            {t("home.branches.viewAll")}
          </Link>
        )}
      </div>

      {branches.length === 0 ? (
        <Empty description={t("home.branches.empty")}>
          <Link to="/branches/add">
            <Button type="primary">{t("home.branches.emptyCta")}</Button>
          </Link>
        </Empty>
      ) : (
        <ul className="home-branches-list">
          {branches.slice(0, 5).map((branch) => (
            <li key={branch.id}>
              <Link to={`/branches/${branch.id}`}>
                <div className="home-branch-info">
                  <strong>{branch.name}</strong>
                  {branch.location?.address && (
                    <span>{branch.location.address}</span>
                  )}
                </div>
                <Tag color={STATUS_COLORS[branch.status] || "default"}>
                  {t(`branchForm.status_${branch.status}`, branch.status)}
                </Tag>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
