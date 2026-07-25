import { Tag } from "antd";
import type { CourtStatus } from "@/api/types";

const COLORS: Record<string, string> = {
  pending_approval: "gold",
  changes_requested: "orange",
  available: "green",
  unavailable: "default",
  pending_payment: "blue",
  suspended: "red",
  active: "green",
};

export default function StatusTag({ status }: { status: CourtStatus | string }) {
  return (
    <Tag color={COLORS[status] ?? "default"} style={{ marginInlineEnd: 0 }}>
      {status.replace(/_/g, " ")}
    </Tag>
  );
}
