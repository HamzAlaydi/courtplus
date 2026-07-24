import React, { useState } from "react";
import { Button, Drawer } from "antd";
import { FaBars } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.scss"; // Import regular Sass
import LangSwitch from "../langSwitch/LangSwitch";
import logo from "../../../assets/imgs/logo.png";

function Navbar() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { key: "home", label: t("home"), path: "/" },
    { key: "menu", label: t("players"), path: "/players" },
    { key: "journal", label: t("journal"), path: "/journal" },
    { key: "faqs", label: t("faqs"), path: "/faqs" },
    { key: "contact", label: t("contacts"), path: "/contact-us" },
  ];

  // Close drawer + scroll to top
  const handleNavClick = () => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="header">
      <Link className="logo-link" to="/" onClick={handleNavClick}>
        <img className="logo" src={logo} alt="Logo" />
      </Link>

      {/* Desktop Nav */}
      <nav className="nav">
        <ul>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.key} className={isActive ? "activeLink" : ""}>
                <Link to={item.path} onClick={handleNavClick}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Buttons */}
      <div className="actions">
        <LangSwitch />
      </div>

      {/* Mobile Menu Button */}
      <Button
        className="mobileMenuBtn"
        type="text"
        icon={<FaBars size={24} />}
        onClick={() => setOpen(true)}
      />

      {/* Mobile Drawer */}
      <div className="sideNav">
        <Drawer
          placement={i18n.language === "ar" ? "left" : "right"}
          onClose={() => setOpen(false)}
          open={open}
        >
          <ul className="mobileNav">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.key} className={isActive ? "activeLink" : ""}>
                  <Link to={item.path} onClick={handleNavClick}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mobileLangSwitch">
            <LangSwitch />
          </div>
        </Drawer>
      </div>
    </header>
  );
}

export default Navbar;
