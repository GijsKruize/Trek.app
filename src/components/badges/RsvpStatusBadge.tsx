import { Check, X, CircleDashed } from "lucide-react";
import type { RsvpStatus } from "@/lib/api/events";

const CONFIG: Record<RsvpStatus, { label: string; icon: typeof Check; className: string }> = {
  yes: { label: "Je komt", icon: Check, className: "bg-success-foreground text-success" },
  no: { label: "Je komt niet", icon: X, className: "bg-error-foreground text-error" },
  pending: { label: "Nog geen reactie", icon: CircleDashed, className: "bg-surface-2 text-muted-foreground" },
};

export function RsvpStatusBadge({ status }: { status: RsvpStatus }) {
  const { label, icon: Icon, className } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </span>
  );
}
