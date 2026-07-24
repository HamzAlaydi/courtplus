import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const SITE_URL = "https://courtplusapp.com";

// Updates document head per page & language. SPA-friendly SEO:
// static defaults live in index.html, this keeps them in sync on navigation.
export default function Seo({ titleKey, descriptionKey }) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    const title = t(titleKey);
    const description = descriptionKey ? t(descriptionKey) : null;
    document.title = title;

    const setMeta = (attr, name, content) => {
      if (content == null) return;
      let el = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", SITE_URL + pathname);
    setMeta(
      "property",
      "og:locale",
      i18n.language === "ar" ? "ar_SA" : "en_US"
    );
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute(
      "href",
      SITE_URL + (pathname === "/" ? "/" : pathname)
    );
  }, [titleKey, descriptionKey, t, i18n.language, pathname]);

  return null;
}
