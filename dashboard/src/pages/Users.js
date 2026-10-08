import { EyeOutlined, SearchOutlined, StopOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { blockUser, getUsers, unBlockUser } from "../actions/admin_action";
const { Option } = Select;

const SORT_OPTIONS = [
  { value: "spending", label: "Total Spending" },
  { value: "bookings", label: "Bookings" },
  { value: "reviews", label: "Reviews" },
  { value: "followers", label: "Followers" },
  { value: "following", label: "Following" },
  { value: "minutes", label: "Minutes" },
];

export default function Users() {
  const { t } = useTranslation();
  // ✅ Query params
  const [queryParams, setQueryParams] = useState({
    page: 1,
    pageSize: 10,
    search: "",
    blocked: undefined,
    sortBy: "spending",
    sortOrder: "DESC",
  });

  // Debounced search
  const [localSearch, setLocalSearch] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQueryParams((prev) => ({
        ...prev,
        page: 1,
        search: localSearch,
      }));
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [localSearch]);

  // Users query
  const { data: usersData, isLoading, isError } = useQuery({
    queryKey: ["users", queryParams],
    queryFn: () => getUsers(queryParams),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (isError) message.error("Failed to load users");
  }, [isError]);

  const users = usersData?.items || [];
  const pagination = usersData?.pagination || { totalCount: 0, currentPage: 1 };

  const getAvatarChar = (u) =>
    u.firstName?.[0] || u.username?.[0] || u.email?.[0] || "?";

  const queryClient = useQueryClient();

  // track currently mutating row (id + type) for per-row loading UI
  const [mutating, setMutating] = useState({ id: null, type: null });

  const blockMutation = useMutation({
    mutationFn: (id) => blockUser(id),
    onMutate: (id) => {
      setMutating({ id, type: "block" });
    },
    onSuccess: () => {
      message.success("User blocked");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      message.error("Failed to block user");
    },
    onSettled: () => {
      setMutating({ id: null, type: null });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (id) => unBlockUser(id),
    onMutate: (id) => {
      setMutating({ id, type: "unblock" });
    },
    onSuccess: () => {
      message.success("User unblocked");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => {
      message.error("Failed to unblock user");
    },
    onSettled: () => {
      setMutating({ id: null, type: null });
    },
  });

  // TABLE COLUMNS
  const columns = [
    {
      title: "User",
      dataIndex: "firstName",
      key: "user",
      render: (_, record) => (
        <div className="staff-person">
          <Avatar size={36} className="staff-avatar">
            {getAvatarChar(record)}
          </Avatar>
          <div className="staff-person-text">
            <span className="staff-person-name">
              {record.firstName || ""} {record.lastName || ""}
            </span>
            <span className="staff-person-meta">
              {record.email || record.username || record.phoneNumber}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (v) => <span className="cp-muted">{v}</span>,
    },
    {
      title: "Bookings",
      dataIndex: "bookingsCount",
      key: "bookings",
      sorter: true,
      render: (v) => <span className="cp-num">{v}</span>,
    },
    {
      title: "Spending",
      dataIndex: "totalSpent",
      key: "spending",
      sorter: true,
      render: (v) => (
        <span className="users-amount">{`${Number(v ?? 0).toLocaleString()} ${t(
          "home.currency"
        )}`}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, r) =>
        r.blockedAt ? (
          <Tag color="red">Blocked</Tag>
        ) : (
          <Tag color="green">Active</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "end",
      render: (_, record) => {
        const isBlocked = !!record.blockedAt;
        const isMutatingThis = mutating.id === record.id;

        return (
          <Space size={6}>
            {/* View */}
            <Button
              icon={<EyeOutlined />}
              size="small"
              shape="circle"
            />

            {/* Block */}
            {!isBlocked && (
              <Popconfirm
                title="Block this user?"
                okText="Yes"
                cancelText="No"
                onConfirm={() => blockMutation.mutate(record.id)}
              >
                <Button
                  icon={<StopOutlined />}
                  size="small"
                  danger
                  loading={isMutatingThis && mutating.type === "block"}
                >
                  Block
                </Button>
              </Popconfirm>
            )}

            {/* Unblock */}
            {isBlocked && (
              <Popconfirm
                title="Unblock this user?"
                okText="Yes"
                cancelText="No"
                onConfirm={() => unblockMutation.mutate(record.id)}
              >
                <Button
                  size="small"
                  type="default"
                  loading={isMutatingThis && mutating.type === "unblock"}
                >
                  Unblock
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="content staff-container users-page">
      <div className="cp-card users-card cp-enter">
        {/* Filters */}
        <div className="users-toolbar">
          <Input
            className="users-search"
            prefix={<SearchOutlined />}
            placeholder="Search users..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            allowClear
          />

          <Select
            className="users-filter"
            allowClear
            placeholder="Blocked"
            value={queryParams.blocked}
            onChange={(value) =>
              setQueryParams((prev) => ({ ...prev, page: 1, blocked: value }))
            }
          >
            <Option value={true}>Blocked</Option>
            <Option value={false}>Active</Option>
          </Select>

          <Select
            className="users-sort"
            value={queryParams.sortBy}
            onChange={(value) =>
              setQueryParams((prev) => ({ ...prev, page: 1, sortBy: value }))
            }
          >
            {SORT_OPTIONS.map((o) => (
              <Option key={o.value} value={o.value}>
                {o.label}
              </Option>
            ))}
          </Select>

          {/* NEW: sort direction */}
          <Select
            className="users-order"
            value={queryParams.sortOrder}
            onChange={(value) =>
              setQueryParams((prev) => ({ ...prev, page: 1, sortOrder: value }))
            }
          >
            <Option value="ASC">ASC</Option>
            <Option value="DESC">DESC</Option>
          </Select>
        </div>

        {/* TABLE */}
        <Table
          loading={isLoading}
          rowKey="id"
          columns={columns}
          dataSource={users}
          pagination={{
            current: pagination.currentPage,
            total: pagination.totalCount,
            pageSize: queryParams.pageSize,
          }}
          onChange={(pagination, filters, sorter) => {
            setQueryParams((prev) => {
              // sorter may be an array (AntD supports multiple) — handle safely
              const s = Array.isArray(sorter) ? sorter[0] : sorter;

              // determine new sortOrder only if sorter.order exists
              const newSortOrder =
                s && s.order
                  ? s.order === "ascend"
                    ? "ASC"
                    : "DESC"
                  : prev.sortOrder;

              // determine new sortBy only if sorter.field exists
              const newSortBy = s && s.field ? s.field : prev.sortBy;

              return {
                ...prev,
                page: pagination.current,
                pageSize: pagination.pageSize,
                sortOrder: newSortOrder,
                sortBy: newSortBy,
              };
            });
          }}
        />
      </div>
    </div>
  );
}
