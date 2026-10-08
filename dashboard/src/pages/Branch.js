import {
  CalendarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  StarFilled,
  UserAddOutlined,
} from "@ant-design/icons";
import { Alert, Button, message, Modal, Select, Spin } from "antd";
import { Link, useParams } from "react-router-dom";
import CourtCard from "../components/CourtCard";
import { useQuery } from "@tanstack/react-query";
import { getBranch } from "../actions/branch_action";
import { getCourts } from "../actions/court_actions";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { assignStaffToBranch, getAllStaff } from "../actions/staff.action";

const filterOptions = ["12 months", "30 days", "7 days", "12 hours"];

export default function Branch() {
  const { t } = useTranslation();
  const { id } = useParams();

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => getAllStaff(),
  });

  useQuery({
    queryKey: ["staff", id],
    queryFn: () => getAllStaff({ branchId: id }),
  });

  const {
    data: branch,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["branch", id],
    queryFn: () => getBranch(id),
    enabled: !!id,
  });

  const { data: courts } = useQuery({
    queryKey: ["branch-courts", id],
    queryFn: () => getCourts({ branchId: id }),
    keepPreviousData: false,
  });

  if (isLoading) {
    return (
      <div className="content branch-page branch-page--state">
        <Spin size="large" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="content">
        <Alert message={t("branch.error_loading")} type="error" showIcon />
      </div>
    );
  }

  console.log(branch);
  console.log(staffData);

  const handleAssignStaff = async () => {
    if (!selectedStaff || selectedStaff.length === 0) {
      message.warning("Please select at least one staff member");
      return;
    }

    setAssigning(true);
    try {
      // ensure payload matches backend expectation (array of ids)
      const payload = {
        branchId: id,
        staffIds: selectedStaff,
      };

      const res = await assignStaffToBranch(payload);
      console.log(res);

      // optional: inspect res to show custom message
      message.success("Staff assigned successfully");
      setStaffModalOpen(false);
      setSelectedStaff([]);
    } catch (err) {
      console.error("assign staff error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to assign staff";
      message.error(errMsg);
    } finally {
      setAssigning(false);
    }
  };

  // Court photos are stored as "court_image"; the first one is the cover (as
  // on the Courts page).
  const getImage = (assets) =>
    assets?.find((asset) => asset.type === "court_image")?.url || null;

  return (
    <div className="content branch-page">
      {branch?.suspendedAt && (
        <Alert
          type="warning"
          showIcon
          message={t("branch.suspended_title", "This branch is suspended")}
          description={branch.suspendedReason}
        />
      )}
      <section className="branch-header">
        <div className="cover-image">
          <img
            src={branch?.coverUrl || "/assets/images/placeholder.png"}
            alt=""
          />
        </div>

        <div className="branch-header-body">
          <div className="branch-info">
            <img
              className="img-circle img-profile"
              src={branch?.logoUrl || "/assets/images/placeholder.png"}
              alt=""
            />
            <div className="text-info">
              <h4>{branch?.name}</h4>
              {branch?.location?.address && (
                <p className="branch-address">
                  <EnvironmentOutlined />
                  <span>{branch.location.address}</span>
                </p>
              )}
              <p className="branch-rating">
                <StarFilled className="branch-rating-star" />
                <strong className="cp-num">
                  {branch?.avgRating?.toFixed?.(1) ?? "0.0"}
                </strong>
                <span aria-hidden="true">·</span>
                <span>
                  {branch?.reviewsCount ?? 0} {t("branch.reviews")}
                </span>
              </p>
            </div>
          </div>

          <div className="branch-actions">
            <Button
              className="staff-button"
              icon={<UserAddOutlined />}
              onClick={() => setStaffModalOpen(true)}
            >
              Add Staff
            </Button>
            <Link to="edit" tabIndex={-1}>
              <Button
                type="primary"
                className="edit-button"
                icon={<EditOutlined />}
              >
                {t("branch.edit_branch")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="dashboard-overview">
        <div className="filter-buttons">
          {filterOptions.map((filter) => (
            <Button key={filter} size="small">
              {filter}
            </Button>
          ))}
          <Button size="small" type="default">
            +
          </Button>
          <Button size="small" icon={<CalendarOutlined />}>
            Select date
          </Button>
          <Button size="small" icon={<FilterOutlined />}>
            Filter
          </Button>
        </div>

        <div className="cp-kpi-grid cp-stagger stats-cards">
          {/* These three cards used to read branch.totalRevenue /
              totalBookings / upcomingBookings — denormalised counters that
              drift away from the real bookings and can even go negative, so
              the page showed 0 for a branch that had taken money. The API
              attaches a live-computed `monthStats` for staff, so read that
              and say in the label that the figures cover the current month.
              `minutesBooked` below has no live equivalent yet. */}
          <div className="cp-kpi cp-kpi--ink stat-card revenue">
            <div className="card-header">
              <span className="cp-kpi__label">
                {t("branch.revenue_this_month")}
              </span>
              <InfoCircleOutlined />
            </div>
            <span className="cp-kpi__value">
              {branch?.monthStats?.totalRevenue?.toLocaleString() ?? 0}
              <span className="cp-kpi__unit">{t("home.currency")}</span>
            </span>
          </div>

          <div className="cp-kpi stat-card">
            <div className="card-header">
              <span className="cp-kpi__label">
                {t("branch.bookings_this_month")}
              </span>
              <InfoCircleOutlined />
            </div>
            <span className="cp-kpi__value">
              {branch?.monthStats?.totalBookings?.toLocaleString() ?? 0}
            </span>
          </div>

          <div className="cp-kpi stat-card small">
            <div className="card-header">
              <span className="cp-kpi__label">
                {t("branch.upcoming_this_month")}
              </span>
              <InfoCircleOutlined />
            </div>
            <span className="cp-kpi__value">
              {branch?.monthStats?.upcomingBookings ?? 0}
            </span>
          </div>

          <div className="cp-kpi stat-card small">
            <div className="card-header">
              <span className="cp-kpi__label">{t("branch.minutes_booked")}</span>
              <InfoCircleOutlined />
            </div>
            <span className="cp-kpi__value">
              {branch?.minutesBooked?.toLocaleString() ?? 0}
            </span>
          </div>
        </div>
      </div>

      <div className="content-header">
        <h4>{t("branch.courts")}</h4>
        <Link to="/courts/add" tabIndex={-1}>
          <Button type="primary" icon={<PlusOutlined />}>
            {t("branch.add_court")}
          </Button>
        </Link>
      </div>

      {courts?.items?.length > 0 && (
        <div className="courts-grid">
          {courts.items.map((court) => (
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
      )}

      <Modal
        title="Assign Staff to Branch"
        open={staffModalOpen}
        onCancel={() => setStaffModalOpen(false)}
        onOk={handleAssignStaff}
        okButtonProps={{
          disabled: selectedStaff.length === 0,
          loading: assigning,
        }}
      >
        <p>Select staff to assign:</p>

        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="Choose staff members"
          value={selectedStaff}
          onChange={(value) => setSelectedStaff(value)}
          loading={loadingStaff}
          optionFilterProp="children"
          showSearch
        >
          {staffData?.items?.map((staff) => (
            // The API returns firstName/lastName, never a `name` field, so
            // every option used to render as a bare " – email".
            <Select.Option key={staff.id} value={staff.id}>
              {[staff.firstName, staff.lastName].filter(Boolean).join(" ") ||
                staff.email}{" "}
              – {staff.email}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}
