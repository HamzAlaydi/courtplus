import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Actions / filters rendered at the end of the header row. */
  extra?: ReactNode;
}

/** Page title row: display-font uppercase title, muted subtitle, end-aligned actions. */
export default function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  return (
    <div className="ops-page-header">
      <div className="ops-page-header__text">
        <h1 className="ops-page-title">{title}</h1>
        {subtitle ? <span className="ops-page-subtitle">{subtitle}</span> : null}
      </div>
      {extra ? <div className="ops-page-header__extra">{extra}</div> : null}
    </div>
  );
}
