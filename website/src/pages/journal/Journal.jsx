import { useState } from "react";
import { Modal } from "antd";
import { useTranslation } from "react-i18next";
import "./Journal.scss";
import { PiFilesThin } from "react-icons/pi";
import { FiArrowUpRight } from "react-icons/fi";
import serviceBg1 from "@/assets/imgs/service1.png";
import serviceBg2 from "@/assets/imgs/service2.png";
import serviceBg3 from "@/assets/imgs/service3.png";
import serviceBg4 from "@/assets/imgs/service4.png";
import serviceBg5 from "@/assets/imgs/service5.png";
import serviceBg6 from "@/assets/imgs/service6.png";
import Marque from "../../components/Marque";
import Faqs from "../../components/faqs/Faqs";
import ContactForm from "../../components/contactForm/ContactForm";
import Seo from "../../components/Seo";

const articleImages = [
  serviceBg1,
  serviceBg6,
  serviceBg2,
  serviceBg3,
  serviceBg4,
  serviceBg5,
];

export default function Journal() {
  const { t } = useTranslation();
  const [openArticle, setOpenArticle] = useState(null);

  const articles = t("journal_page.articles", { returnObjects: true }).map(
    (a, i) => ({ ...a, image: articleImages[i] })
  );

  return (
    <div className="journal">
      <Seo
        titleKey="seo.journal_title"
        descriptionKey="seo.journal_description"
      />

      <div className="hero-section">
        <div className="flash-bg" />
        <div className="content">
          <div></div>
          <div>
            <h1>{t("journal_page.hero_title")}</h1>
            <h2>{t("journal_page.hero_subtitle")}</h2>
          </div>

          <div className="feature">
            {articles.slice(0, 3).map((a, i) => (
              <button
                type="button"
                className="feature-item"
                key={i}
                onClick={() => setOpenArticle(a)}
              >
                <PiFilesThin size={70} color="#a9e23c" />
                <p>{a.title}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/**Articles */}
      <section className="section service">
        {articles.map((a, i) => (
          <article
            className="service-item"
            key={i}
            onClick={() => setOpenArticle(a)}
          >
            <img src={a.image} alt={a.title} />
            <h3>{a.title}</h3>
            <p>{a.excerpt}</p>
            <button type="button" className="learn-more">
              <h5>{t("journal_page.read_more")}</h5> <FiArrowUpRight />
            </button>
          </article>
        ))}
      </section>

      <Marque />
      <Faqs />
      <ContactForm />

      {/* Article popup */}
      <Modal
        open={!!openArticle}
        onCancel={() => setOpenArticle(null)}
        footer={null}
        centered
        width={760}
        className="article-modal"
      >
        {openArticle && (
          <div className="article-body">
            <img src={openArticle.image} alt={openArticle.title} />
            <h2>{openArticle.title}</h2>
            {openArticle.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
