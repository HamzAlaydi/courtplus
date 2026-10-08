import React from "react";
import { CheckOutlined, RightOutlined } from "@ant-design/icons";
import { Progress } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ProfileCompletionCard({
  tenant,
  branches = [],
  hasSubscription = false,
}) {
  const { t } = useTranslation();

  // Computed from live data (backend profileCompletion flags are stale)
  const items = [
    {
      id: "name",
      label: t("home.completion.name"),
      done: !!tenant?.name?.trim(),
      to: "/settings",
    },
    {
      id: "phoneNumber",
      label: t("home.completion.phoneNumber"),
      done: !!tenant?.phoneNumber?.trim(),
      to: "/settings",
    },
    {
      id: "logo",
      label: t("home.completion.logo"),
      done: !!tenant?.logoURL,
      to: "/settings",
    },
    {
      id: "branches",
      label: t("home.completion.branches"),
      done: branches.length > 0,
      to: "/branches/add",
    },
    {
      id: "courts",
      label: t("home.completion.courts"),
      done: (tenant?.totalCourts ?? 0) > 0,
      to: "/courts/add",
    },
    {
      id: "subscription",
      label: t("home.completion.subscription"),
      done: hasSubscription,
      to: "/billing",
    },
  ];

  const doneCount = items.filter((item) => item.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return (
    <section className="cp-card home-card home-completion">
      <div className="cp-section-head">
        <h3 className="cp-section-title">{t("home.completion.title")}</h3>
        <span className="home-completion-percent cp-num">{percent}%</span>
      </div>
      <Progress
        percent={percent}
        showInfo={false}
        strokeColor="#0a1517"
        trailColor="#eef1f0"
        size={["100%", 8]}
        className="home-completion-progress"
      />
      {percent === 100 ? (
        <p className="home-completion-done">
          <span className="home-completion-check">
            <CheckOutlined />
          </span>
          {t("home.completion.allDone")}
        </p>
      ) : (
        <ul className="home-completion-list">
          {items.map((item) => (
            <li key={item.id} className={item.done ? "done" : ""}>
              <span className="home-completion-label">
                <span className="home-completion-check" aria-hidden="true">
                  {item.done && <CheckOutlined />}
                </span>
                {item.label}
              </span>
              {!item.done && (
                <Link to={item.to} className="cp-link home-completion-link">
                  {t("home.completion.complete")}
                  <RightOutlined className="home-completion-arrow" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
