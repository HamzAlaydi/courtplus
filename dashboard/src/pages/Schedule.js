import { useTranslation } from "react-i18next";
import MyCalendar from "../components/Schedule/MyCalendar";
import { Button, Segmented, Select, Spin } from "antd";
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
    <div className="content schedule">
      <div className="schedule-toolbar">
        <Segmented
          className="schedule-view-toggle"
          value={viewType}
          onChange={setViewType}
          options={[
            {
              value: "list",
              icon: <UnorderedListOutlined />,
              label: t("schedule.list"),
            },
            {
              value: "grid",
              icon: <AppstoreOutlined />,
              label: t("schedule.grid"),
            },
          ]}
        />

        <div className="schedule-toolbar-actions">
          {/* Branch Selector */}
          <Select
            className="schedule-branch-select"
            showSearch
            allowClear
            placeholder={t("schedule.select_branch")}
            suffixIcon={<EnvironmentOutlined />}
            value={selectedBranch}
            onChange={setSelectedBranch}
            onSearch={(value) => setSearch(value)}
            notFoundContent={isLoading ? <Spin size="small" /> : null}
            filterOption={false} // important to use API filtering
            options={options}
          />

          <Button
            type="primary"
            className="schedule-new-booking"
            onClick={() => setOpenModal(true)}
          >
            {t("schedule.new_booking")}
          </Button>
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
