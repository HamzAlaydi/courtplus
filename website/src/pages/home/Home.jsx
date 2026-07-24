// src/pages/Home/Home.jsx
import React, { useState } from "react";
import { Modal } from "antd";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import "./Home.scss";
import heroImg from "@/assets/imgs/home-hero.png";
import aboutBg from "@/assets/imgs/home-about.png";
import worksBg from "@/assets/imgs/home-works.png";
import manageBg from "@/assets/imgs/home-manage.png";
import planProIcon from "@/assets/imgs/plan-pro.png";
import planEnterIcon from "@/assets/imgs/plan-enter.png";
import homePowerImg from "@/assets/imgs/home-power.png";

import {
  FaCalendarAlt,
  FaCheckCircle,
  FaCreditCard,
  FaPlay,
  FaRegCheckCircle,
  FaUsers,
} from "react-icons/fa";
import { PiCourtBasketball } from "react-icons/pi";
import { MdOutlineInsights, MdSettingsInputComposite } from "react-icons/md";
import { GrAnnounce } from "react-icons/gr";
import { RiUserAddFill } from "react-icons/ri";

import Marque from "../../components/Marque";
import Faqs from "../../components/faqs/Faqs";
import ContactForm from "../../components/contactForm/ContactForm";
import Seo from "../../components/Seo";

import {
  staggerContainer,
  fadeUp,
  scaleIn,
  cardHover,
} from "@/components/motion";

const runCardIcons = [
  <FaCalendarAlt />,
  <PiCourtBasketball />,
  <FaCreditCard />,
  <FaUsers />,
  <MdSettingsInputComposite />,
  <GrAnnounce />,
];

const worksCardIcons = [
  <RiUserAddFill />,
  <PiCourtBasketball />,
  <FaRegCheckCircle />,
  <MdOutlineInsights />,
];

const scrollToContact = () => {
  document
    .getElementById("contact-form")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function Home() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const youtubeLink = "https://www.youtube.com/embed/ScMzIvxBSi4";

  const runCards = t("run.cards", { returnObjects: true });
  const worksCards = t("works.cards", { returnObjects: true });

  const plans = [
    {
      icon: planEnterIcon,
      currency: "$",
      price: 30,
      per: t("plans.basic_per"),
      sub: t("plans.basic_sub"),
      tag: t("plans.basic_tag"),
      features: t("plans.basic_features", { returnObjects: true }),
      btn: t("plans.basic_btn"),
      highlight: false,
    },
    {
      icon: planProIcon,
      currency: t("plans.enterprise_currency"),
      price: "10",
      per: t("plans.enterprise_per"),
      tag: t("plans.enterprise_tag"),
      features: t("plans.enterprise_features", { returnObjects: true }),
      btn: t("plans.enterprise_btn"),
      highlight: true,
    },
  ];

  return (
    <motion.div
      className="home"
      initial="hidden"
      animate="show"
      variants={staggerContainer}
    >
      <Seo titleKey="seo.home_title" descriptionKey="seo.home_description" />

      {/* HERO */}
      <section className="hero-section">
        <div className="flash-bg" />
        <motion.div className="content" variants={staggerContainer}>
          <motion.h1 variants={fadeUp} className="hero-title">
            <span className="active">{t("hero.title_active")}</span>
            <br /> {t("hero.title_rest")}
          </motion.h1>

          <motion.h6 variants={fadeUp} className="hero-sub">
            {t("hero.subtitle")}
          </motion.h6>

          <motion.div className="p-btn" variants={fadeUp}>
            <h5>{t("hero.owner_question")}</h5>
            <button className="btn-primary" onClick={scrollToContact}>
              {t("hero.subscribe_now")}
            </button>
          </motion.div>
        </motion.div>

        <motion.img
          src={heroImg}
          alt="Court+ dashboard and mobile app"
          className="hero-image"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </section>

      {/* ABOUT */}
      <section className="section about-section">
        <div className="flash-bg" />
        <motion.div
          className="about-left"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          <h2>{t("about.title")}</h2>
          <p>{t("about.text")}</p>
          <button className="about-btn" onClick={() => setOpen(true)}>
            {t("about.learn_more")}
          </button>
        </motion.div>

        <motion.div
          className="about-right"
          style={{ backgroundImage: `url(${aboutBg})` }}
          variants={scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <motion.button
            className="play-btn"
            onClick={() => setOpen(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Play video"
          >
            <FaPlay size={22} />
          </motion.button>
        </motion.div>
      </section>

      {/* RUN CARDS */}
      <section className="section run">
        <motion.div
          className="intro"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <h2>{t("run.title")}</h2>
          <h5>{t("run.subtitle")}</h5>
        </motion.div>

        <motion.div
          className="run-cards"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {runCards.map((c, i) => (
            <motion.div
              className="run-card"
              key={i}
              whileHover="hover"
              whileTap={{ scale: 0.995 }}
              animate="show"
              variants={cardHover}
            >
              <div className="icon-container">{runCardIcons[i]}</div>
              <h4>{c.title}</h4>
              <p>{c.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* WORKS */}
      <section className="section works">
        <div className="works-body">
          <motion.div
            className="works-content"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.p className="active" variants={fadeUp}>
              {t("works.tag")}
            </motion.p>
            <motion.h1 variants={fadeUp}>{t("works.title")}</motion.h1>
            <motion.h6 variants={fadeUp}>{t("works.subtitle")}</motion.h6>
            <motion.div variants={fadeUp}>
              <button className="btn-primary" onClick={scrollToContact}>
                {t("hero.subscribe_now")}
              </button>
            </motion.div>
          </motion.div>

          <motion.img
            src={worksBg}
            alt="Court+ booking flow"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          />
        </div>

        <motion.div
          className="works-cards"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {worksCards.map((card, i) => (
            <motion.div
              key={i}
              className="works-card"
              variants={fadeUp}
              whileHover={{ y: -6 }}
            >
              <div className="works-card-header">
                {worksCardIcons[i]}
                <h4>{card.title}</h4>
              </div>
              <h6>{card.text}</h6>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* MANAGE */}
      <section className="section manage">
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {t("manage.title")}
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {t("manage.subtitle")}
        </motion.p>
        <motion.img
          src={manageBg}
          alt="Court+ dashboard overview"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        />
      </section>

      {/* PLANS */}
      <section className="section plan">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <h1>{t("plans.title")}</h1>
        </motion.div>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <p>{t("plans.subtitle")}</p>
        </motion.div>

        <motion.div
          className="plan-cards"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {plans.map((p, i) => (
            <motion.div
              key={i}
              className={`pricing-card ${p.highlight ? "featured" : ""}`}
              variants={cardHover}
              whileHover="hover"
            >
              <div className="pricing-header">
                <div className="pricing-header-content">
                  <span className="badge">{p.tag}</span>
                  <div>
                    <h2>
                      <span>{p.currency}</span>
                      {p.price}
                      <small>{p.per}</small>
                    </h2>
                    {p.sub && <p className="sub">{p.sub}</p>}
                  </div>
                </div>

                <div className="pricing-header-icon">
                  <img src={p.icon} alt={p.tag} />
                </div>
              </div>
              <ul>
                {p.features.map((f, idx) => (
                  <li key={idx}>
                    <FaCheckCircle
                      color="#87c600"
                      style={{ fontWeight: 700 }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <button className="pricing-btn" onClick={scrollToContact}>
                {p.btn}
              </button>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Marque />
      <Faqs />

      <section className="section power">
        <motion.div
          className="content"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <h2>
            {t("power.title_pre")}{" "}
            <span className="active">{t("power.title_highlight")}</span>
          </h2>
          <p>{t("power.text")}</p>
          <button className="btn-primary" onClick={scrollToContact}>
            {t("hero.subscribe_now")}
          </button>
        </motion.div>
        <motion.img
          src={homePowerImg}
          alt="Court+ mobile app"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        />
      </section>

      <ContactForm />

      {/* Modal Video with AnimatePresence */}
      <AnimatePresence>
        {open && (
          <Modal
            open={open}
            footer={null}
            centered
            onCancel={() => setOpen(false)}
            width={920}
            className="video-modal"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="video-wrapper"
            >
              <iframe
                width="100%"
                height="500"
                src={youtubeLink}
                title="Court+ Video"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
