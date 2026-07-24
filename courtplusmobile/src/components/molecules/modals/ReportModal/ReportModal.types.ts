export type Step = "list" | "details";

export type ReportModalProps = {
  onClose: (showSuccess?: boolean) => void;
  entityId: string;
  entity: "user" | "branch" | "court" | "booking";
};
