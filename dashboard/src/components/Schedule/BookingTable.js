import { Table, Avatar, Tooltip } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { getMatches } from "../../actions/match_actions";
import dayjs from "dayjs";

const BookingTable = ({ branchId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["matches", branchId],
    queryFn: () => getMatches({ page: 1, pageSize: 100, branchId: branchId }),
  });

  console.log(data);

  if (isLoading) return;

  const columns = [
    {
      title: "Booking ID",
      dataIndex: "id",
      key: "id",
      render: (id) => id.slice(0, 8),
    },
    {
      title: "Court",
      key: "court",
      render: (_, record) => {
        const court = record.court;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src={court.mainAsset}
              alt={court.name}
              width={40}
              height={40}
              style={{ borderRadius: 6 }}
            />
            <strong>{court.name}</strong>
          </div>
        );
      },
    },
    {
      title: "Branch",
      key: "branch",
      render: (record) => record.court.branch.name,
    },
    {
      title: "Player",
      key: "player",
      render: (record) => {
        const creator = record.participants.find((p) => p.isCreator)?.user;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar src={creator?.avatarUrl} />
            <strong>
              {creator?.firstName} {creator?.lastName}
            </strong>
          </div>
        );
      },
    },
    {
      title: "Book Type",
      dataIndex: "paymentType",
      key: "paymentType",
      render: (val) => {
        if (val === "whole") return "Through Call";
        return val;
      },
    },
    {
      title: "Date & Time",
      key: "dateTime",
      render: (record) => (
        <div>
          <div>{`${dayjs(record.startDate).format("HH:mm")} - ${dayjs(
            record.endDate
          ).format("HH:mm")}`}</div>
          <div style={{ color: "#888", fontSize: 12 }}>
            {dayjs(record.startDate).format("DD MMM YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record) => (
        <Tooltip title="View Details">
          <a href={`/schedule/${record.id}`}>
            <LinkOutlined />
          </a>
        </Tooltip>
      ),
    },
  ];

  return (
    <Table
      key="id"
      columns={columns}
      dataSource={data?.items}
      rowKey="bookingId"
      pagination={false}
    />
  );
};

export default BookingTable;
