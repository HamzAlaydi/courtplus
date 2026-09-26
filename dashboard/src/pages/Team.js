import { CloseOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getBranches } from "../actions/branch_action";
import {
  getAllStaff,
  getAllStaffInvitations,
  getMe,
  revokeInvitation,
  sendInvitation,
  unassignStaffFromBranch,
  updateStaffRole,
} from "../actions/staff.action";
import { useNotification } from "../modules/NotificationProvider";
import { notifyError } from "../utils/errorMessages";

// Every endpoint this page uses is guarded by the Owner role in
// backend/src/modules/staff/staff.controller.ts (list, invite, list/revoke
// invitations, change role, unassign), so anyone else would only ever see
// 403s here. The check below is against /staff/me, not localStorage.
const OWNER_ROLE = "Owner";

// Roles an Owner may hand out. CreateStaffInvitationDto / UpdateStaffRoleDto
// accept nothing else: Owner is fixed for the account and SuperAdmin is a
// platform role the service explicitly refuses to grant from here.
const ASSIGNABLE_ROLES = ["Admin", "User"];

const ROLE_LABEL_KEYS = {
  Owner: "staff.owner",
  Admin: "staff.role_admin",
  User: "staff.role_user",
  SuperAdmin: "staff.role_superadmin",
};

const PAGE_SIZE = 10;
// Branch rosters are read one branch at a time (see branchesByStaffId below);
// ask for a full page so a branch with many staff is not truncated at 10.
const ROSTER_PAGE_SIZE = 100;
const BRANCHES_PAGE_SIZE = 100;

export default function Team() {
  const { t, i18n } = useTranslation();
  const notify = useNotification();
  const queryClient = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm] = Form.useForm();
  const [page, setPage] = useState(1);

  const {
    data: me,
    isLoading: loadingMe,
    isError: meError,
  } = useQuery({ queryKey: ["staff-me"], queryFn: getMe });

  const isOwner = me?.role === OWNER_ROLE;

  const { data: staffData, isLoading: loadingStaff } = useQuery({
    queryKey: ["team-staff", page],
    queryFn: () => getAllStaff({ page, pageSize: PAGE_SIZE }),
    enabled: isOwner,
    placeholderData: keepPreviousData,
  });

  const { data: invitationsData, isLoading: loadingInvitations } = useQuery({
    queryKey: ["team-invitations"],
    queryFn: getAllStaffInvitations,
    enabled: isOwner,
  });

  const { data: branchesData } = useQuery({
    queryKey: ["team-branches"],
    queryFn: () => getBranches({ page: 1, pageSize: BRANCHES_PAGE_SIZE }),
    enabled: isOwner,
  });

  const branches = branchesData?.items || [];

  // GET /staff returns a member's role but not their branch assignments, and
  // it only accepts a branchId *filter*. So read each branch's roster and
  // invert the result into staffId -> branches. A vendor has a handful of
  // branches and the server caches each roster, so this stays cheap.
  const branchRosters = useQueries({
    queries: branches.map((branch) => ({
      queryKey: ["team-branch-staff", branch.id],
      queryFn: () =>
        getAllStaff({ branchId: branch.id, pageSize: ROSTER_PAGE_SIZE }),
      enabled: isOwner,
    })),
  });

  const branchesByStaffId = {};
  branchRosters.forEach((roster, index) => {
    const branch = branches[index];
    if (!branch) return;
    (roster.data?.items || []).forEach((member) => {
      if (!branchesByStaffId[member.id]) branchesByStaffId[member.id] = [];
      branchesByStaffId[member.id].push(branch);
    });
  });

  const roleLabel = (role) =>
    ROLE_LABEL_KEYS[role] ? t(ROLE_LABEL_KEYS[role]) : role;

  const refreshRoster = () => {
    queryClient.invalidateQueries({ queryKey: ["team-staff"] });
    queryClient.invalidateQueries({ queryKey: ["team-branch-staff"] });
  };

  const inviteMutation = useMutation({
    mutationFn: (values) => sendInvitation(values),
    onSuccess: () => {
      setInviteOpen(false);
      inviteForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      notify("success", t("staff.invitation_sent"));
    },
    onError: (err) => notifyError(notify, err, t, "staff.invitation_failed"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => revokeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      notify("success", t("staff.invitation_deleted"));
    },
    onError: (err) => notifyError(notify, err, t, "staff.delete_failed"),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateStaffRole(id, { role }),
    onSuccess: () => {
      refreshRoster();
      notify("success", t("staff.role_updated_toast"));
    },
    onError: (err) => notifyError(notify, err, t, "staff.role_update_failed"),
  });

  const unassignMutation = useMutation({
    mutationFn: ({ staffId, branchId }) =>
      unassignStaffFromBranch({ branchId, staffIds: [staffId] }),
    onSuccess: () => {
      refreshRoster();
      notify("success", t("staff.removed_from_branch"));
    },
    onError: (err) => notifyError(notify, err, t, "staff.remove_failed"),
  });

  if (loadingMe) {
    return (
      <div className="staff-container">
        <Spin size="large" />
      </div>
    );
  }

  if (meError) {
    return (
      <div className="staff-container">
        <Alert type="error" showIcon message={t("staff.load_failed")} />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="staff-container">
        <Alert type="warning" showIcon message={t("staff.owner_only")} />
      </div>
    );
  }

  const staffColumns = [
    {
      title: t("staff.member"),
      key: "member",
      render: (_, record) => {
        const fullName = [record.firstName, record.lastName]
          .filter(Boolean)
          .join(" ");
        return (
          <div>
            <div>{fullName || record.email}</div>
            <Typography.Text type="secondary">{record.email}</Typography.Text>
          </div>
        );
      },
    },
    {
      title: t("staff.role"),
      key: "role",
      render: (_, record) => {
        // The service refuses to change an Owner's role
        // (CANNOT_MODIFY_OWNER_ROLE), and demoting yourself is never what an
        // Owner means to do — show a plain tag rather than a control whose
        // only outcome is an error.
        if (record.role === OWNER_ROLE || record.id === me?.id) {
          return <Tag color="gold">{roleLabel(record.role)}</Tag>;
        }
        return (
          <Select
            value={record.role}
            style={{ width: 140 }}
            loading={
              roleMutation.isPending && roleMutation.variables?.id === record.id
            }
            onChange={(role) => roleMutation.mutate({ id: record.id, role })}
            options={ASSIGNABLE_ROLES.map((role) => ({
              value: role,
              label: roleLabel(role),
            }))}
          />
        );
      },
    },
    {
      title: t("staff.branches"),
      key: "branches",
      render: (_, record) => {
        const assigned = branchesByStaffId[record.id] || [];
        if (assigned.length === 0) {
          return (
            <Typography.Text type="secondary">
              {t("staff.no_branch")}
            </Typography.Text>
          );
        }
        return (
          <Space wrap size={[8, 8]}>
            {assigned.map((branch) => (
              <Tag key={branch.id} style={{ marginInlineEnd: 0 }}>
                {branch.name}
                <Popconfirm
                  title={t("staff.confirm_remove_from_branch", {
                    branch: branch.name,
                  })}
                  okText={t("common.yes")}
                  cancelText={t("common.no")}
                  onConfirm={() =>
                    unassignMutation.mutate({
                      staffId: record.id,
                      branchId: branch.id,
                    })
                  }
                >
                  <CloseOutlined
                    style={{ marginInlineStart: 6, cursor: "pointer" }}
                  />
                </Popconfirm>
              </Tag>
            ))}
          </Space>
        );
      },
    },
  ];

  const invitationColumns = [
    {
      title: t("staff.email"),
      dataIndex: "email",
      key: "email",
    },
    {
      title: t("staff.role"),
      dataIndex: "role",
      key: "role",
      render: (role) => <Tag>{roleLabel(role)}</Tag>,
    },
    {
      title: t("staff.branch"),
      key: "branch",
      render: (_, record) => {
        const branch = branches.find((b) => b.id === record.branchId);
        return branch ? (
          branch.name
        ) : (
          <Typography.Text type="secondary">
            {t("staff.no_branch")}
          </Typography.Text>
        );
      },
    },
    {
      title: t("staff.expires"),
      dataIndex: "expires",
      key: "expires",
      render: (value) =>
        value ? new Date(value).toLocaleDateString(i18n.language) : "-",
    },
    {
      title: t("staff.actions"),
      key: "actions",
      render: (_, record) => (
        <Popconfirm
          title={t("staff.confirm_revoke")}
          okText={t("common.yes")}
          cancelText={t("common.no")}
          onConfirm={() => revokeMutation.mutate(record.id)}
        >
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            loading={
              revokeMutation.isPending &&
              revokeMutation.variables === record.id
            }
          >
            {t("staff.revoke")}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="staff-container">
      <div className="staff-header">
        <div>
          <Typography.Title level={4} style={{ marginBottom: 0 }}>
            {t("staff.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("staff.subtitle")}
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setInviteOpen(true)}
        >
          {t("staff.add_member")}
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loadingStaff}
        columns={staffColumns}
        dataSource={staffData?.items || []}
        locale={{ emptyText: t("staff.no_members") }}
        pagination={{
          current: staffData?.pagination?.currentPage || page,
          total: staffData?.pagination?.totalCount || 0,
          pageSize: PAGE_SIZE,
          hideOnSinglePage: true,
          onChange: (nextPage) => setPage(nextPage),
        }}
      />

      <Typography.Title level={5} style={{ marginTop: 32 }}>
        {t("staff.pending_invitations")}
      </Typography.Title>
      <Table
        rowKey="id"
        loading={loadingInvitations}
        columns={invitationColumns}
        dataSource={invitationsData?.items || []}
        locale={{ emptyText: t("staff.no_invitations") }}
        pagination={false}
      />

      <Modal
        open={inviteOpen}
        title={t("staff.modal_title")}
        onCancel={() => setInviteOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={inviteForm}
          layout="vertical"
          preserve={false}
          initialValues={{ role: "User" }}
          onFinish={(values) => inviteMutation.mutate(values)}
        >
          <Form.Item
            name="email"
            label={t("staff.email")}
            rules={[
              { required: true, message: t("staff.email_required") },
              { type: "email", message: t("staff.email_invalid") },
            ]}
          >
            <Input placeholder={t("staff.email_placeholder")} />
          </Form.Item>

          <Form.Item
            name="role"
            label={t("staff.role")}
            rules={[{ required: true, message: t("staff.role_required") }]}
          >
            <Select
              options={ASSIGNABLE_ROLES.map((role) => ({
                value: role,
                label: roleLabel(role),
              }))}
            />
          </Form.Item>

          {/* Optional: the invitation carries the branch, and accepting it
              assigns the new member to it in the same transaction. */}
          <Form.Item name="branchId" label={t("staff.branch_optional")}>
            <Select
              allowClear
              placeholder={t("staff.branch_placeholder")}
              options={branches.map((branch) => ({
                value: branch.id,
                label: branch.name,
              }))}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={inviteMutation.isPending}
            block
          >
            {t("staff.send_invitation")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
