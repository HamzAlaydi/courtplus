import { useState } from "react";
import {
  App,
  Button,
  Empty,
  Input,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Typography,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  denyUnsuspendRequest,
  listTenants,
  listUnsuspendRequests,
  resolveUnsuspendRequest,
  suspendTenant,
  unsuspendTenant,
} from "@/api/ops";
import { apiErrorMessage } from "@/api/client";
import type { Tenant, UnsuspendRequest } from "@/api/types";
import ReasonModal from "@/components/ReasonModal";
import StatusTag from "@/components/StatusTag";

function TenantsTab() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<Tenant | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ops", "tenants", { page, pageSize, search }],
    queryFn: () => listTenants({ page, pageSize, search: search || undefined }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ops", "tenants"] });
    queryClient.invalidateQueries({ queryKey: ["ops", "unsuspend-requests"] });
  };

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      suspendTenant(id, reason),
    onSuccess: () => {
      message.success("Vendor suspended");
      setSuspendTarget(null);
      invalidate();
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to suspend vendor")),
  });

  const unsuspendMutation = useMutation({
    mutationFn: unsuspendTenant,
    onSuccess: () => {
      message.success("Vendor unsuspended");
      invalidate();
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to unsuspend vendor")),
  });

  return (
    <>
      <Input.Search
        placeholder="Search by name"
        allowClear
        onSearch={(v) => {
          setSearch(v.trim());
          setPage(1);
        }}
        style={{ maxWidth: 320, marginBottom: 16 }}
      />
      <Table<Tenant>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.items}
        locale={{ emptyText: <Empty description="No vendors found" /> }}
        pagination={{
          current: page,
          pageSize,
          total: data?.pagination.totalCount,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        columns={[
          { title: "Name", dataIndex: "name", render: (v?: string) => v ?? "—" },
          {
            title: "Contact",
            dataIndex: "phoneNumber",
            render: (v?: string) => v ?? "—",
          },
          { title: "Branches", dataIndex: "totalBranches", width: 100, render: (v?: number) => v ?? 0 },
          { title: "Courts", dataIndex: "totalCourts", width: 90, render: (v?: number) => v ?? 0 },
          {
            title: "Status",
            dataIndex: "blockedAt",
            width: 120,
            render: (blockedAt?: string | null) =>
              blockedAt ? <StatusTag status="suspended" /> : <StatusTag status="active" />,
          },
          {
            title: "Joined",
            dataIndex: "createdAt",
            render: (d: string) => dayjs(d).format("MMM D, YYYY"),
          },
          {
            title: "Actions",
            width: 140,
            render: (_, t) =>
              t.blockedAt ? (
                <Popconfirm
                  title="Unsuspend this vendor?"
                  onConfirm={() => unsuspendMutation.mutate(t.id)}
                >
                  <Button size="small" type="primary">
                    Unsuspend
                  </Button>
                </Popconfirm>
              ) : (
                <Button size="small" danger onClick={() => setSuspendTarget(t)}>
                  Suspend
                </Button>
              ),
          },
        ]}
      />
      <ReasonModal
        open={!!suspendTarget}
        title={`Suspend vendor — ${suspendTarget?.name ?? ""}`}
        confirmText="Suspend"
        danger
        loading={suspendMutation.isPending}
        onConfirm={(reason) =>
          suspendTarget && suspendMutation.mutate({ id: suspendTarget.id, reason })
        }
        onCancel={() => setSuspendTarget(null)}
      />
    </>
  );
}

function UnsuspendRequestsTab() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [denyTarget, setDenyTarget] = useState<UnsuspendRequest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ops", "unsuspend-requests", { page, pageSize }],
    queryFn: () => listUnsuspendRequests({ page, pageSize }),
    refetchInterval: 30_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ops", "unsuspend-requests"] });
    queryClient.invalidateQueries({ queryKey: ["ops", "tenants"] });
  };

  const resolveMutation = useMutation({
    mutationFn: resolveUnsuspendRequest,
    onSuccess: () => {
      message.success("Request approved — vendor unsuspended");
      invalidate();
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to resolve request")),
  });

  const denyMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      denyUnsuspendRequest(id, reason),
    onSuccess: () => {
      message.success("Request denied — vendor stays suspended");
      setDenyTarget(null);
      invalidate();
    },
    onError: (e) => message.error(apiErrorMessage(e, "Failed to deny request")),
  });

  return (
    <>
      <Table<UnsuspendRequest>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.items}
        locale={{ emptyText: <Empty description="Inbox zero — no pending requests" /> }}
        pagination={{
          current: page,
          pageSize,
          total: data?.pagination.totalCount,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        columns={[
          {
            title: "Vendor",
            render: (_, r) => r.tenant?.name ?? r.tenantId,
          },
          {
            title: "Message",
            dataIndex: "message",
            render: (m: string) => (
              <Typography.Paragraph style={{ margin: 0, maxWidth: 480 }} ellipsis={{ rows: 2, expandable: true }}>
                {m}
              </Typography.Paragraph>
            ),
          },
          {
            title: "Requested",
            dataIndex: "createdAt",
            width: 170,
            render: (d: string) => dayjs(d).format("MMM D, YYYY HH:mm"),
          },
          {
            title: "Actions",
            width: 220,
            render: (_, r) => (
              <Space size="small">
                <Popconfirm
                  title="Approve this request and unsuspend the vendor?"
                  description="The vendor's account is reinstated and their staff are notified."
                  onConfirm={() => resolveMutation.mutate(r.id)}
                >
                  <Button size="small" type="primary">
                    Approve & unsuspend
                  </Button>
                </Popconfirm>
                <Button size="small" danger onClick={() => setDenyTarget(r)}>
                  Deny
                </Button>
              </Space>
            ),
          },
        ]}
      />
      <ReasonModal
        open={!!denyTarget}
        title={`Deny unsuspend request — ${denyTarget?.tenant?.name ?? ""}`}
        confirmText="Deny request"
        danger
        loading={denyMutation.isPending}
        onConfirm={(reason) =>
          denyTarget && denyMutation.mutate({ id: denyTarget.id, reason })
        }
        onCancel={() => setDenyTarget(null)}
      />
    </>
  );
}

export default function VendorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "requests" ? "requests" : "vendors";

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Vendors
      </Typography.Title>
      <Tabs
        activeKey={tab}
        onChange={(k) => setSearchParams(k === "requests" ? { tab: "requests" } : {})}
        items={[
          { key: "vendors", label: "All Vendors", children: <TenantsTab /> },
          {
            key: "requests",
            label: "Unsuspend Requests",
            children: <UnsuspendRequestsTab />,
          },
        ]}
      />
    </>
  );
}
