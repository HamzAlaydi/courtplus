interface BrandMarkProps {
  /** `onInk` for dark surfaces (sidebar, login), `light` for ground/white. */
  tone?: "onInk" | "light";
  size?: "sm" | "md" | "lg";
}

/** "court+" wordmark with the OPS tag. */
export default function BrandMark({ tone = "onInk", size = "md" }: BrandMarkProps) {
  const className = [
    "ops-brand",
    tone === "light" ? "ops-brand--light" : "",
    size !== "md" ? `ops-brand--${size}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} role="img" aria-label="Court+ Ops Console">
      <span className="ops-brand__word" aria-hidden="true">
        court<span className="ops-brand__plus">+</span>
      </span>
      <span className="ops-brand__tag" aria-hidden="true">
        OPS
      </span>
    </div>
  );
}
