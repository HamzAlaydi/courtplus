import client from "./client";
import type {
  Court,
  CourtStatus,
  LogAction,
  LogEntity,
  OpsLog,
  Paginated,
  StaffRole,
  StaffUser,
  Tenant,
  UnsuspendRequest,
} from "./types";

interface PageParams {
  page?: number;
  pageSize?: number;
}

// --- Courts moderation ---
export async function listPendingCourts(
  params: PageParams & { status?: CourtStatus },
): Promise<Paginated<Court>> {
  const { data } = await client.get("/ops/courts/pending", { params });
  return data;
}

export async function approveCourt(id: string): Promise<Court> {
  const { data } = await client.post(`/ops/courts/${id}/approve`);
  return data;
}

export async function requestCourtChanges(id: string, reason: string): Promise<Court> {
  const { data } = await client.post(`/ops/courts/${id}/request-changes`, { reason });
  return data;
}

export async function suspendCourt(id: string, reason: string): Promise<Court> {
  const { data } = await client.post(`/ops/courts/${id}/suspend`, { reason });
  return data;
}

export async function unsuspendCourt(id: string): Promise<Court> {
  const { data } = await client.post(`/ops/courts/${id}/unsuspend`);
  return data;
}

// --- Branches ---
export async function suspendBranch(id: string, reason: string) {
  const { data } = await client.post(`/ops/branches/${id}/suspend`, { reason });
  return data;
}

export async function unsuspendBranch(id: string) {
  const { data } = await client.post(`/ops/branches/${id}/unsuspend`);
  return data;
}

// --- Tenants (vendors) ---
// NOTE: there is no GET /ops/tenants route; the SUPER_ADMIN vendors list is
// served by the Admin controller at GET /admin/tenants.
export async function listTenants(
  params: PageParams & { search?: string; blocked?: boolean },
): Promise<Paginated<Tenant>> {
  const { data } = await client.get("/admin/tenants", { params });
  return data;
}

export async function suspendTenant(id: string, reason: string): Promise<Tenant> {
  const { data } = await client.post(`/ops/tenants/${id}/suspend`, { reason });
  return data;
}

export async function unsuspendTenant(id: string): Promise<Tenant> {
  const { data } = await client.post(`/ops/tenants/${id}/unsuspend`);
  return data;
}

// --- Unsuspend requests inbox ---
export async function listUnsuspendRequests(
  params: PageParams,
): Promise<Paginated<UnsuspendRequest>> {
  const { data } = await client.get("/ops/unsuspend-requests", { params });
  return data;
}

export async function resolveUnsuspendRequest(id: string): Promise<UnsuspendRequest> {
  const { data } = await client.post(`/ops/unsuspend-requests/${id}/resolve`);
  return data;
}

// --- Ops admins ---
export async function listAdmins(params: PageParams): Promise<Paginated<StaffUser>> {
  const { data } = await client.get("/ops/admins", { params });
  return data;
}

export async function createAdmin(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<StaffUser> {
  const { data } = await client.post("/ops/admins", payload);
  return data;
}

export async function updateAdminRole(id: string, role: StaffRole) {
  const { data } = await client.patch(`/ops/admins/${id}/role`, { role });
  return data;
}

export async function deactivateAdmin(id: string): Promise<void> {
  await client.patch(`/ops/admins/${id}/deactivate`);
}

// --- Audit logs ---
export async function listLogs(
  params: PageParams & {
    actorEmail?: string;
    entity?: LogEntity;
    action?: LogAction;
    from?: string;
    to?: string;
  },
): Promise<Paginated<OpsLog>> {
  const { data } = await client.get("/ops/logs", { params });
  return data;
}
