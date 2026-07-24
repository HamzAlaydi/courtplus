import React from "react";
import { CheckCircleFilled, RightOutlined } from "@ant-design/icons";
import { Progress } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ProfileCompletionCard({ tenant }) {
  const { t } = useTranslation();

  const completion = tenant?.profileCompletion || {};
  const items = [
    {
      id: "name",
      label: t("home.completion.name"),
      done: !!completion.name,
      to: "/settings",
    },
    {
      id: "phoneNumber",
      label: t("home.completion.phoneNumber"),
      done: !!completion.phoneNumber,
      to: "/settings",
    },
    {
      id: "logo",
      label: t("home.completion.logo"),
      done: !!completion.logo,
      to: "/settings",
    },
    {
      id: "branches",
      label: t("home.completion.branches"),
      done: !!completion.branches,
      to: "/branches/add",
    },
    {
      id: "courts",
      label: t("home.completion.courts"),
      done: !!completion.courts,
      to: "/courts/add",
    },
  ];

  const doneCount = items.filter((item) => item.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return (
    <div className="home-card home-completion">
      <h4 className="home-card-title">{t("home.completion.title")}</h4>
      <Progress
        percent={percent}
        strokeColor="#c0ff42"
        className="home-completion-progress"
      />
      {percent === 100 ? (
        <p className="home-completion-done">
          <CheckCircleFilled /> {t("home.completion.allDone")}
        </p>
      ) : (
        <ul className="home-completion-list">
          {items.map((item) => (
            <li key={item.id} className={item.done ? "done" : ""}>
              <span className="home-completion-label">
                <CheckCircleFilled />
                {item.label}
              </span>
              {!item.done && (
                <Link to={item.to} className="home-completion-link">
                  {t("home.completion.complete")} <RightOutlined />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
