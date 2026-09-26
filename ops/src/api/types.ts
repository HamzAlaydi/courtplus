export interface Pagination {
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface ApiError {
  statusCode: number;
  code?: string;
  message?: string | string[];
}

export type StaffRole = "SuperAdmin" | "Owner" | "Admin" | "User";

export interface StaffUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: StaffRole;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: StaffUser;
  requiresVerification?: boolean;
}

export type CourtStatus =
  | "available"
  | "unavailable"
  | "pending_payment"
  | "pending_approval"
  | "changes_requested"
  | "suspended";

export interface Asset {
  id: string;
  url?: string;
  mimeType?: string;
  type?: string; // court_image | court_video | ...
  position?: number;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  country?: string;
}

export interface Tenant {
  id: string;
  name?: string;
  phoneNumber?: string;
  totalBranches?: number;
  totalCourts?: number;
  totalStaff?: number;
  totalBookings?: number;
  totalReviews?: number;
  totalRevenue?: number;
  blockedAt?: string | null;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  tenantId: string;
  tenant?: Tenant;
  suspendedAt?: string | null;
  location?: Location;
}

export interface Court {
  id: string;
  name: string;
  description?: string;
  branchId: string;
  branch?: Branch;
  location?: Location;
  assets?: Asset[];
  sport: string;
  surface: string;
  size: string;
  length: number;
  width: number;
  hourlyRate: number;
  currency?: string;
  status: CourtStatus;
  submittedAt?: string;
  createdAt: string;
}

export interface UnsuspendRequest {
  id: string;
  tenantId: string;
  tenant?: Tenant;
  message: string;
  resolvedAt?: string | null;
  /** How ops closed it; null while still pending. */
  outcome?: "approved" | "denied" | null;
  resolutionReason?: string | null;
  createdAt: string;
}

export type LogAction = "create" | "update" | "delete";
export type LogEntity =
  | "user"
  | "booking"
  | "review"
  | "court"
  | "branch"
  | "tenant"
  | "staff"
  | "subscription"
  | "ops_admin"
  | "unsuspend_request";

export interface OpsLog {
  id: string;
  action: LogAction;
  entity: LogEntity;
  actorStaffId?: string;
  actorEmail?: string;
  userId?: string;
  userType?: string;
  oldSnapshot?: Record<string, unknown> | null;
  newSnapshot?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: string;
  resourceId?: string;
  title?: string;
  content?: string;
  data?: {
    kind?: string;
    courtId?: string;
    branchId?: string;
    tenantId?: string;
    courtName?: string;
    branchName?: string;
    tenantName?: string;
    reason?: string;
    message?: string;
  };
  readAt?: string | null;
  seenAt?: string | null;
  createdAt: string;
}

export type PayoutStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface Payout {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  provider: string;
  providerPayoutId?: string | null;
  requestedByStaffId?: string | null;
  sentAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant | null;
  requestedBy?: StaffUser | null;
}
