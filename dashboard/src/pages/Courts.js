import { useEffect, useState } from "react";
import { Alert, Button, Empty, Input, Pagination, Select, Spin } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import CourtCard from "../components/CourtCard";
import { getCourts } from "../actions/court_actions";
import { getBranches } from "../actions/branch_action";
import { getPendingCharges } from "../actions/billing_action";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// 🖼️ Default fallback image
const FALLBACK_IMAGE = "/assets/images/placeholder.png";
const PAGE_SIZE = 12;

export default function Courts() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 🔹 Pending payment courts (drives the billing banner)
  const { data: pendingCharges } = useQuery({
    queryKey: ["billing-pending-charges"],
    queryFn: getPendingCharges,
  });
  const [bannerVisible, setBannerVisible] = useState(true);

  // 🔹 Filters & pagination state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState();
  const [sport, setSport] = useState();
  const [status, setStatus] = useState();
  const [page, setPage] = useState(1);

  // 🔹 Debounce the search box (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  // 🔹 Fetch courts with applied filters
  const params = {
    page,
    pageSize: PAGE_SIZE,
    ...(search && { search }),
    ...(branchId && { branchId }),
    ...(sport && { sport }),
    ...(status && { status }),
  };

  const { isLoading, data } = useQuery({
    queryKey: ["all-courts", params],
    queryFn: () => getCourts(params),
    placeholderData: (previousData) => previousData,
  });

  // 🔹 Fetch branches for the branch filter
  const { data: branchData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches({ page: 1, pageSize: 100 }),
  });

  // 🔹 Return a valid image URL or fallback
  const getImage = (assets) => {
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return FALLBACK_IMAGE;
    }

    const imageAssets = assets.filter((asset) => asset.type === "court_image");
    if (imageAssets.length > 0) {
      // The first image is the vendor's cover; a random pick changed on every render.
      return imageAssets[0]?.url || FALLBACK_IMAGE;
    }

    return FALLBACK_IMAGE;
  };

  // 🔹 Group courts by branch
  const courts = data?.items || [];
  const groupedByBranch = courts.reduce((groups, court) => {
    const key = court.branch?.id || "unknown";
    if (!groups[key]) {
      groups[key] = {
        name: court.branch?.name || t("courts.unknown_branch"),
        courts: [],
      };
    }
    groups[key].courts.push(court);
    return groups;
  }, {});
  const branchGroups = Object.values(groupedByBranch);

  return (
    <Spin spinning={isLoading}>
      <div className="content courts-page">
        {/* 🔹 Pending payment banner */}
        {bannerVisible && pendingCharges?.count > 0 && (
          <Alert
            type="warning"
            showIcon
            closable
            onClose={() => setBannerVisible(false)}
            message={t("courts.pending_payment_banner")}
            action={
              <Button size="small" type="primary" onClick={() => navigate("/billing")}>
                {t("courts.pending_payment_action")}
              </Button>
            }
          />
        )}

        {/* 🔹 Filters + add court */}
        <div className="content-header courts-toolbar">
          <div className="courts-filters">
            <Input
              allowClear
              prefix={<SearchOutlined className="courts-filter-search-icon" />}
              placeholder={t("courts.search_placeholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="courts-filter-search"
            />
            <Select
              allowClear
              placeholder={t("courts.all_branches")}
              value={branchId}
              onChange={handleFilterChange(setBranchId)}
              options={branchData?.items?.map((branch) => ({
                value: branch.id,
                label: branch.name,
              }))}
            />
            <Select
              allowClear
              placeholder={t("courts.all_sports")}
              value={sport}
              onChange={handleFilterChange(setSport)}
              options={["tennis", "football", "paddle", "volleyball"].map(
                (value) => ({ value, label: t(`courtForm.${value}`) })
              )}
            />
            <Select
              allowClear
              placeholder={t("courts.all_statuses")}
              value={status}
              onChange={handleFilterChange(setStatus)}
              options={["available", "unavailable"].map((value) => ({
                value,
                label: t(`courtCard.status.${value}`),
              }))}
            />
          </div>
          <Link to="add" tabIndex={-1} className="courts-toolbar-cta">
            <Button type="primary" icon={<PlusOutlined />}>
              {t("courts.add_new")}
            </Button>
          </Link>
        </div>

        {/* 🔹 Courts grouped by branch */}
        {courts.length ? (
          branchGroups.map((group) => (
            <section key={group.name} className="courts-branch-group">
              <div className="cp-section-head courts-branch-head">
                <h5 className="cp-section-title courts-branch-title">
                  {group.name}
                </h5>
                <span className="cp-pill cp-pill--neutral cp-num">
                  {group.courts.length}
                </span>
              </div>
              <div className="courts-grid">
                {group.courts.map((court) => (
                  <CourtCard
                    key={court.id}
                    id={court.id}
                    name={court.name}
                    status={court.status}
                    image={getImage(court.assets)}
                    court={court}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="cp-card courts-empty">
            <Empty description={t("courts.no_courts")} />
          </div>
        )}

        {/* 🔹 Pagination */}
        {data?.pagination?.totalCount > 0 && (
          <div className="courts-pagination">
            <Pagination
              current={data.pagination.currentPage}
              pageSize={PAGE_SIZE}
              total={data.pagination.totalCount}
              onChange={setPage}
              showSizeChanger={false}
              showTotal={(total) => t("courts.total_courts", { total })}
            />
          </div>
        )}
      </div>
    </Spin>
  );
}
