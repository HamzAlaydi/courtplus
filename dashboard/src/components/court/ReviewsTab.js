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
      <div className="court-tab-state">
        <Spin size="large" />
      </div>
    );

  if (isError)
    return (
      <div className="court-tab-state court-tab-state--error">
        {t("reviews.errorLoading")}
      </div>
    );

  if (reviews.length === 0)
    return (
      <div className="court-tab-state">
        <Empty description={t("reviews.noReviews")} />
      </div>
    );

  return (
    <div className={`reviews-wrapper ${isRTL ? "rtl" : ""}`}>
      <List
        itemLayout="vertical"
        dataSource={reviews}
        split={false}
        className="reviews-list"
        renderItem={(review) => {
          const user = review.user || {};
          const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

          return (
            <List.Item className="review-item">
              <div className="review-header">
                <Avatar
                  size={44}
                  src={user.avatarUrl}
                  className="review-avatar"
                >
                  {user.firstName?.[0]}
                </Avatar>

                <div className="review-info">
                  <strong className="review-name">
                    {name || t("reviews.unknownUser")}
                  </strong>
                  <small className="review-date">
                    {new Date(review.booking?.startDate).toLocaleDateString()}
                  </small>
                </div>

                <div className="review-rating">
                  <Rate disabled defaultValue={review.rating} allowHalf />
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
