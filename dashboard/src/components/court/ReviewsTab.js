import { useQuery } from "@tanstack/react-query";
import { List, Avatar, Rate, Spin, Empty } from "antd";
import { useTranslation } from "react-i18next";
import { getAllReviews } from "../../actions/reviews_action";

export default function ReviewsTab({ courtId }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["court-reviews", courtId],
    queryFn: () => getAllReviews({ page: 1, pageSize: 99, courtId }),
    enabled: !!courtId,
  });

  const reviews = data?.items || [];

  if (isLoading)
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );

  if (isError)
    return (
      <div style={{ textAlign: "center", padding: 20 }}>
        {t("reviews.errorLoading")}
      </div>
    );

  if (reviews.length === 0)
    return (
      <Empty description={t("reviews.noReviews")} style={{ padding: 20 }} />
    );

  return (
    <div
      className={`reviews-wrapper ${isRTL ? "rtl" : ""}`}
      style={{ padding: "1rem" }}
    >
      <List
        itemLayout="vertical"
        dataSource={reviews}
        renderItem={(review) => {
          const user = review.user || {};
          const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

          return (
            <List.Item className="review-item">
              <div className="review-header">
                <Avatar
                  size={48}
                  src={user.avatarUrl}
                  style={{ backgroundColor: "#ddd", marginInlineEnd: "10px" }}
                >
                  {user.firstName?.[0]}
                </Avatar>

                <div className="review-info">
                  <strong className="review-name">
                    {name || t("reviews.unknownUser")}
                  </strong>
                  <div className="review-rating">
                    <Rate disabled defaultValue={review.rating} allowHalf />
                  </div>
                  <small className="review-date">
                    {new Date(review.booking?.startDate).toLocaleDateString()}
                  </small>
                </div>
              </div>

              <p className="review-comment">{review.comment}</p>
            </List.Item>
          );
        }}
      />
    </div>
  );
}
