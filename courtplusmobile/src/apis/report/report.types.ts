export interface CreateReportRequest {
  entityId: string;
  entity: "user" | "branch" | "court" | "booking";
  reason: string;
  description?: string;
}
