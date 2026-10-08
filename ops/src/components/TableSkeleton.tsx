interface TableSkeletonProps {
  /** Number of placeholder rows. */
  rows?: number;
  /** Leading shape of each row: a round avatar, a square thumbnail, or nothing. */
  lead?: "avatar" | "thumb" | "none";
  /** Adds a shorter secondary bar under each row's main bar. */
  meta?: boolean;
}

/** Shimmering placeholder rows shown as a table's empty state while its first page loads. */
export default function TableSkeleton({
  rows = 4,
  lead = "avatar",
  meta = false,
}: TableSkeletonProps) {
  return (
    <div className="ops-table-skeleton" role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="ops-table-skeleton__row" aria-hidden="true">
          {lead === "none" ? null : <span className={`ops-skeleton ops-table-skeleton__${lead}`} />}
          <span className="ops-table-skeleton__lines">
            <span className="ops-skeleton" style={{ width: `${Math.max(60 - i * 9, 24)}%` }} />
            {meta ? <span className="ops-skeleton ops-table-skeleton__meta" /> : null}
          </span>
        </span>
      ))}
    </div>
  );
}
