import type { Status } from "@/lib/application";

const STYLES: Record<Status, string> = {
  new: "border border-ink/40 text-ink",
  under_review: "border border-line bg-space-900 text-ink-muted",
  shortlisted: "border border-orbit/60 bg-orbit/10 text-orbit-ink",
  accepted: "border border-signal/60 bg-signal/15 text-signal",
  not_selected: "border border-aero/40 text-[#B42323]",
};

export function StatusBadge({ status, label }: { status: Status; label: string }) {
  return <span className={`badge whitespace-nowrap ${STYLES[status]}`}>{label}</span>;
}
