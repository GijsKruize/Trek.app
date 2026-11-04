import { TriangleAlert } from "lucide-react";
import type { DietWarning } from "@/lib/pocketbase/types";

/** Dietary/allergy conflict badge — always icon + word, never color
 * alone. Uses Mosterd (warning), not Biet (error): a diet mismatch is a
 * heads-up, not a hard failure. */
export function WarningBadge({ warning }: { warning: DietWarning }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-foreground px-2.5 py-1 text-caption font-medium text-warning">
      <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2.5} />
      {warning.label}
    </span>
  );
}

export function WarningBadgeList({ warnings }: { warnings: DietWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {warnings.map((warning, i) => (
        <WarningBadge key={`${warning.kind}-${i}`} warning={warning} />
      ))}
    </div>
  );
}
