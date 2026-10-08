import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Avatar, Spin, Empty, Pagination } from "antd";
import { HeartFilled } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { getPosts } from "../../actions/global.actions";

const PAGE_SIZE = 10;

export default function PostsTab({ courtId }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["court-posts", courtId, page],
    queryFn: () => getPosts({ courtId, page, pageSize: PAGE_SIZE }),
    enabled: !!courtId,
    keepPreviousData: true,
  });

  const posts = data?.items || [];
  const pagination = data?.pagination || { totalCount: 0, totalPages: 0 };

  if (isLoading)
    return (
      <div className="posts-loading">
        <Spin size="large" />
      </div>
    );

  if (isError) return <div className="posts-error">{t("posts.error")}</div>;

  if (posts.length === 0)
    return (
      <div className="posts-empty">
        <Empty description={t("posts.noPosts")} />
      </div>
    );

  return (
    <div className={`posts-wrapper ${isRTL ? "rtl" : ""}`}>
      {/* POSTS GRID */}
      <div className="posts-grid">
        {posts.map((post, index) => {
          const user = post.user || {};
          const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

          return (
            <Card
              key={index}
              className="post-card"
              cover={
                post.assetUrl ? (
                  <img
                    src={post.assetUrl}
                    alt="post"
                    className="post-image"
                    loading="lazy"
                  />
                ) : null
              }
            >
              {/* Header */}
              <div className="post-header">
                <Avatar src={user.avatarUrl} size={40} className="post-avatar">
                  {user.firstName?.[0]}
                </Avatar>

                <div className="post-user">
                  <strong className="post-name">
                    {name || t("posts.unknownUser")}
                  </strong>
                  <small className="post-date">
                    {new Date(
                      post.createdAt || post.booking?.startDate
                    ).toLocaleDateString()}
                  </small>
                </div>
              </div>

              {/* Post body */}
              <p className="post-body">{post.body}</p>

              {/* Likes */}
              <div className="post-likes">
                <HeartFilled className="post-likes-icon" />
                <span className="cp-num">{post.likesCount}</span>{" "}
                {t("posts.likes")}
              </div>
            </Card>
          );
        })}
      </div>

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <Pagination
          current={page}
          pageSize={PAGE_SIZE}
          total={pagination.totalCount}
          onChange={(p) => setPage(p)}
          showSizeChanger={false}
          className="posts-pagination"
        />
      )}
    </div>
  );
}
