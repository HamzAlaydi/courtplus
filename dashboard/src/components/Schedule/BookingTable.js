import { Table, Avatar, Tooltip } from "antd";
import { LinkOutlined, UserOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getMatches } from "../../actions/match_actions";
import dayjs from "dayjs";

const BookingTable = ({ branchId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["matches", branchId],
    queryFn: () => getMatches({ page: 1, pageSize: 100, branchId: branchId }),
  });

  console.log(data);

  const columns = [
    {
      title: "Booking ID",
      dataIndex: "id",
      key: "id",
      render: (id) => <span className="booking-table-id">{id.slice(0, 8)}</span>,
    },
    {
      title: "Court",
      key: "court",
      render: (_, record) => {
        const court = record.court;
        return (
          <div className="booking-table-entity">
            <img
              className="booking-table-thumb"
              src={court.mainAsset}
              alt={court.name}
              width={44}
              height={44}
            />
            <span className="booking-table-name">{court.name}</span>
          </div>
        );
      },
    },
    {
      title: "Branch",
      key: "branch",
      render: (record) => (
        <span className="cp-muted">{record.court.branch.name}</span>
      ),
    },
    {
      title: "Player",
      key: "player",
      render: (record) => {
        const creator = record.participants.find((p) => p.isCreator)?.user;
        return (
          <div className="booking-table-entity">
            <Avatar
              size={36}
              className="booking-table-avatar"
              src={creator?.avatarUrl}
              icon={!creator?.avatarUrl && <UserOutlined />}
            />
            <span className="booking-table-name">
              {creator?.firstName} {creator?.lastName}
            </span>
          </div>
        );
      },
    },
    {
      title: "Book Type",
      dataIndex: "paymentType",
      key: "paymentType",
      render: (val) => {
        const label = val === "whole" ? "Through Call" : val;
        if (!label) return label;
        return <span className="cp-pill cp-pill--neutral">{label}</span>;
      },
    },
    {
      title: "Date & Time",
      key: "dateTime",
      render: (record) => (
        <div className="booking-table-when">
          <span className="booking-table-time">{`${dayjs(
            record.startDate
          ).format("HH:mm")} - ${dayjs(record.endDate).format("HH:mm")}`}</span>
          <span className="cp-caption">
            {dayjs(record.startDate).format("DD MMM YYYY")}
          </span>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "end",
      render: (record) => (
        <Tooltip title="View Details">
          <a
            className="booking-table-open"
            href={`/schedule/${record.id}`}
            aria-label="View Details"
          >
            <LinkOutlined />
          </a>
        </Tooltip>
      ),
    },
  ];

  return (
    <Table
      key="id"
      className="booking-table cp-enter"
      loading={isLoading}
      columns={columns}
      dataSource={data?.items}
      rowKey="bookingId"
      pagination={false}
    />
  );
};

export default BookingTable;
