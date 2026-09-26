import { useTranslation } from "react-i18next";
import MyCalendar from "../components/Schedule/MyCalendar";
import { Select, Spin } from "antd";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import BookingModal from "../components/Schedule/BookingModal";
import BookingTable from "../components/Schedule/BookingTable";
import { useQuery } from "@tanstack/react-query";
import { getBranches } from "../actions/branch_action";

export default function Schedule() {
  const [viewType, setViewType] = useState("grid");
  const { t } = useTranslation();
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");

  const {
    isLoading,
    data: branchData,
    refetch,
  } = useQuery({
    queryKey: ["branches", search],
    queryFn: () =>
      getBranches({
        page: 1,
        pageSize: 100,
        search: search || null,
      }),
  });

  const options = (branchData?.items || []).map((branch) => ({
    label: branch.name, // change to whatever field you want to show
    value: branch.id,
  }));

  return (
    <div className="schedule">
      <div className="schedule-header">
        <button
          onClick={() => setOpenModal(true)}
          className="toggle-btn active"
        >
          {t("schedule.new_booking")}
        </button>

        {/* Custom Toggle Buttons */}
        <div className="schedule-header-filters">
          <div className="toggle-buttons">
            <button
              className={
                viewType === "list" ? "toggle-btn active" : "toggle-btn"
              }
              onClick={() => setViewType("list")}
            >
              <UnorderedListOutlined />
              <span>{t("schedule.list")}</span>
            </button>
            <button
              className={
                viewType === "grid" ? "toggle-btn active" : "toggle-btn"
              }
              onClick={() => setViewType("grid")}
            >
              <AppstoreOutlined />
              <span>{t("schedule.grid")}</span>
            </button>
          </div>

          {/* Branch Selector */}
          <Select
            showSearch
            allowClear
            placeholder={t("schedule.select_branch")}
            suffixIcon={<EnvironmentOutlined />}
            size="large"
            value={selectedBranch}
            onChange={setSelectedBranch}
            onSearch={(value) => setSearch(value)}
            notFoundContent={isLoading ? <Spin size="small" /> : null}
            filterOption={false} // important to use API filtering
            options={options}
            style={{ width: 250 }}
          />
        </div>
      </div>
      {viewType === "grid" && <MyCalendar branchId={selectedBranch} />}
      {viewType === "list" && <BookingTable branchId={selectedBranch} />}
      <BookingModal
        open={openModal}
        onClose={() => {
          refetch();
          setOpenModal(false);
        }}
      />
    </div>
  );
}
