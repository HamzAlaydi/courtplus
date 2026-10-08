import React, { useState, useMemo } from "react";
import { Button, Space, Table, Input, Row, Col, Card } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FiExternalLink } from "react-icons/fi";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getBranches } from "../actions/branch_action";
import dayjs from "dayjs";
import { debounce } from "lodash";

const { Search } = Input;

export default function Branches() {
  const { t } = useTranslation();

  // 🔹 User filters
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: null,
    placeId: null,
    lat: null,
    lng: null,
    radius: null,
  });

  // 🔹 Filters applied to API request
  const [appliedFilters, setAppliedFilters] = useState(filters);

  // 🔹 Debounced function to apply filters to API
  const debouncedApplyFilters = useMemo(
    () =>
      debounce((updatedFilters) => {
        const cleaned = Object.fromEntries(
          Object.entries(updatedFilters).filter(
            ([_, v]) => v !== null && v !== ""
          )
        );
        setAppliedFilters(cleaned);
      }, 500),
    []
  );

  // 🔹 Trigger search automatically on change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [field]: value, page: 1 };
      debouncedApplyFilters(updated);
      return updated;
    });
  };

  // 🔹 Reset filters
  const resetFilters = () => {
    const reset = {
      page: 1,
      pageSize: 10,
      search: null,
      placeId: null,
      lat: null,
      lng: null,
      radius: null,
    };
    setFilters(reset);
    setAppliedFilters(reset);
  };

  // 🔹 Fetch branches
  const { isLoading, data: branchData } = useQuery({
    queryKey: ["branches", appliedFilters],
    queryFn: () => getBranches(appliedFilters),
    keepPreviousData: true,
  });

  console.log(branchData);

  const paginationData = branchData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  };

  const dataSource = branchData?.items?.map((branch) => ({
    key: branch.id,
    logo: branch.logoUrl,
    name: branch.name,
    location: branch.location?.name || "N/A",
    addedDate: dayjs(branch.createdAt).format("YYYY-MM-DD"),
    totalRevenue: `${Number(branch.totalRevenue ?? 0).toLocaleString()} ${t(
      "home.currency"
    )}`,
    action: branch.id,
  }));

  const columns = [
    {
      title: t("branches.column_name"),
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Link to={`/branches/${record.key}`} className="branches-name-cell">
          <img
            className="cp-thumb branches-logo"
            src={record?.logo || "/assets/images/placeholder.png"}
            alt="Branch Logo"
            loading="lazy"
          />
          <span className="branches-name">{text}</span>
        </Link>
      ),
    },
    {
      title: t("branches.column_location"),
      dataIndex: "location",
      key: "location",
      render: (text) => <span className="branches-muted">{text}</span>,
    },
    {
      title: t("branches.column_added_date"),
      dataIndex: "addedDate",
      key: "addedDate",
      render: (text) => <span className="branches-muted cp-num">{text}</span>,
    },
    {
      title: t("branches.column_total_revenue"),
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      render: (text) => (
        <strong className="branches-revenue cp-num">{text}</strong>
      ),
    },
    {
      title: t("branches.column_action"),
      key: "action",
      align: "end",
      render: (_, record) => (
        <Space>
          <Link
            to={`/branches/${record.key}`}
            className="branches-open-link"
            aria-label={t("branches.column_action")}
          >
            <FiExternalLink size={18} />
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div className="content branches-page">
      <div className="content-header branches-head">
        <Link to="/branches/add" tabIndex={-1}>
          <Button type="primary" icon={<PlusOutlined />}>
            {t("branches.btn_add_branch")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="filter-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder={t("branches.search_placeholder")}
              allowClear
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder={t("branches.place_id_placeholder")}
              allowClear
              value={filters.placeId}
              onChange={(e) => handleFilterChange("placeId", e.target.value)}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder={t("branches.latitude_placeholder")}
              type="number"
              allowClear
              value={filters.lat}
              onChange={(e) => handleFilterChange("lat", e.target.value)}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder={t("branches.longitude_placeholder")}
              type="number"
              allowClear
              value={filters.lng}
              onChange={(e) => handleFilterChange("lng", e.target.value)}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder={t("branches.radius_placeholder")}
              type="number"
              allowClear
              value={filters.radius}
              onChange={(e) => handleFilterChange("radius", e.target.value)}
            />
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Button onClick={resetFilters} block>
              {t("branches.btn_reset")}
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        className="branches-table"
        scroll={{ x: 760 }}
        columns={columns}
        dataSource={dataSource}
        loading={isLoading}
        pagination={{
          current: paginationData.currentPage,
          total: paginationData.totalCount,
          pageSize: filters.pageSize,
          onChange: (page) => {
            const updated = { ...filters, page };
            setFilters(updated);
            setAppliedFilters(updated);
          },
        }}
      />
    </div>
  );
}
