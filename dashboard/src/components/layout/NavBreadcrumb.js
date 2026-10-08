import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Map known route segments to their locale keys
const SEGMENT_KEYS = {
  home: "sideNav.home",
  users: "sideNav.users",
  branches: "sideNav.branches",
  courts: "sideNav.courts",
  schedule: "sideNav.schedule",
  billing: "sideNav.billing",
  team: "sideNav.team",
  // The page's own heading ("Account settings" in Arabic), now shown here
  settings: "settings.title",
  add: "breadcrumb.add",
  edit: "breadcrumb.edit",
};

// Fallback for non-mapped segments (ids, unknown slugs):
// capitalize and replace dashes
const formatBreadcrumb = (str) => {
  return str
    .replace(/-/g, " ") // Replace dashes with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
};

/**
 * Top-bar heading: the current section in the display face, with the
 * breadcrumb trail above it once the route is more than one level deep.
 */
const NavBreadcrumb = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const getSegmentLabel = (segment) => {
    const key = SEGMENT_KEYS[segment];
    return key ? t(key) : formatBreadcrumb(segment);
  };

  // Split pathname and remove empty values
  const pathSnippets = location.pathname.split("/").filter((i) => i);
  const isHome =
    pathSnippets.length === 0 ||
    (pathSnippets.length === 1 && pathSnippets[0] === "home");

  const title = isHome ? t("sideNav.home") : getSegmentLabel(pathSnippets[0]);

  const breadcrumbItems = [
    {
      title: <Link to="/home">{t("sideNav.home")}</Link>, // Always show "Home" as first breadcrumb
    },
    ...pathSnippets.map((segment, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join("/")}`; // Build path dynamically
      // Entity ids: show the short id (as the page header does) instead of a
      // UUID chopped into "B32c8454 4f13 4835 …".
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      return {
        title: isId ? segment.slice(0, 8) : getSegmentLabel(segment),
        href: index !== pathSnippets.length - 1 ? url : null, // Only link if not last item
      };
    }),
  ];

  return (
    <div className="nav-heading">
      {pathSnippets.length > 1 && (
        <Breadcrumb
          className="nav-trail"
          separator="/"
          items={breadcrumbItems}
        />
      )}
      <h1 className="nav-title">{title}</h1>
    </div>
  );
};

export default NavBreadcrumb;
