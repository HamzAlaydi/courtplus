import React from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";

// Function to format the breadcrumb text (capitalize and replace dashes)
const formatBreadcrumb = (str) => {
  return str
    .replace(/-/g, " ") // Replace dashes with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
};

const NavBreadcrumb = () => {
  const location = useLocation();

  // If the path is exactly "/" or "/home", just return "Home" only
  if (location.pathname === "/" || location.pathname === "/home") {
    return <Breadcrumb separator=">" items={[{ title: "Home" }]} />;
  }

  // Split pathname and remove empty values
  const pathSnippets = location.pathname.split("/").filter((i) => i);

  const breadcrumbItems = [
    {
      title: <Link to="/home">Home</Link>, // Always show "Home" as first breadcrumb
    },
    ...pathSnippets.map((segment, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join("/")}`; // Build path dynamically
      return {
        title: formatBreadcrumb(segment),
        href: index !== pathSnippets.length - 1 ? url : null, // Only link if not last item
      };
    }),
  ];

  return <Breadcrumb separator=">" items={breadcrumbItems} />;
};

export default NavBreadcrumb;
