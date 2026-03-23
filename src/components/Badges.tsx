import clsx from "clsx";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW:           { label: "New",           className: "badge-new" },
  LEAD:          { label: "Lead",          className: "badge-lead" },
  INTERESTED:    { label: "Interested",    className: "badge-interested" },
  ENROLLED:      { label: "Enrolled",      className: "badge-enrolled" },
  NOT_INTERESTED:{ label: "Not Interested",className: "badge-not_interested" },
};

const INTEREST_CONFIG: Record<string, { label: string; className: string }> = {
  HIGH: { label: "High", className: "interest-high" },
  MID:  { label: "Mid",  className: "interest-mid" },
  LOW:  { label: "Low",  className: "interest-low" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, className: "" };
  return (
    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold", cfg.className)}>
      {cfg.label}
    </span>
  );
}

export function InterestBadge({ interest }: { interest: string }) {
  const cfg = INTEREST_CONFIG[interest] || { label: interest, className: "" };
  return (
    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-semibold", cfg.className)}>
      {cfg.label}
    </span>
  );
}
