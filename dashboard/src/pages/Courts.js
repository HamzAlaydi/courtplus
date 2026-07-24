import { Button, Spin } from "antd";
import { Link } from "react-router-dom";
import CourtCard from "../components/CourtCard";
import { getCourts } from "../actions/court_actions";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// 🖼️ Default fallback image
const FALLBACK_IMAGE = "/assets/images/placeholder.png";

export default function Courts() {
  const { t } = useTranslation();

  // 🔹 Fetch courts
  const { isLoading, data } = useQuery({
    queryKey: ["all-courts"],
    queryFn: getCourts,
  });

  // 🔹 Return a valid image URL or fallback
  const getImage = (assets) => {
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return FALLBACK_IMAGE;
    }

    const imageAssets = assets.filter((asset) => asset.type === "court_image");
    if (imageAssets.length > 0) {
      const randomIndex = Math.floor(Math.random() * imageAssets.length);
      return imageAssets[randomIndex]?.url || FALLBACK_IMAGE;
    }

    return FALLBACK_IMAGE;
  };

  return (
    <Spin spinning={isLoading}>
      <div className="content">
        <div className="content-header">
          <h4>{t("courts.title")}</h4>
          <Link to="add">
            <Button type="primary">+ {t("courts.add_new")}</Button>
          </Link>
        </div>

        {data?.items?.length ? (
          data.items.map((court) => (
            <CourtCard
              key={court.id}
              id={court.id}
              name={court.name}
              status={court.status}
              image={getImage(court.assets)}
              court={court}
            />
          ))
        ) : (
          <p className="no-data">{t("courts.no_courts")}</p>
        )}
      </div>
    </Spin>
  );
}
