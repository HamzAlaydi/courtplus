import type { CSSProperties, ReactNode } from "react";
import type { CourtStatus } from "@/api/types";

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "muted" | "feature" | "ink";

const TONES: Record<string, StatusTone> = {
  available: "success",
  active: "success",
  completed: "success",
  approved: "success",
  create: "success",
  pending_approval: "warning",
  changes_requested: "warning",
  pending: "warning",
  update: "warning",
  pending_payment: "muted",
  processing: "muted",
  unavailable: "neutral",
  cancelled: "neutral",
  suspended: "danger",
  failed: "danger",
  denied: "danger",
  rejected: "danger",
  delete: "danger",
  yes: "feature",
  no: "neutral",
};

/** Tone a status / log action / flag value maps to; unknown values are neutral. */
export function statusTone(status: string): StatusTone {
  return TONES[status] ?? "neutral";
}

function humanize(status: string): string {
  const text = status.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface StatusTagProps {
  status: CourtStatus | string;
  /** Overrides the text derived from `status`. */
  label?: ReactNode;
  /** Overrides the tone derived from `status`. */
  tone?: StatusTone;
  size?: "sm" | "md";
  className?: string;
  style?: CSSProperties;
}

export default function StatusTag({
  status,
  label,
  tone,
  size = "md",
  className,
  style,
}: StatusTagProps) {
  const classes = [
    "ops-pill",
    `ops-pill--${tone ?? statusTone(status)}`,
    size === "sm" ? "ops-pill--sm" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} style={style}>
      {label ?? humanize(status)}
    </span>
  );
}
