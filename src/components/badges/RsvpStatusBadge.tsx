import { Check, X, CircleDashed } from "lucide-react";
import type { RsvpStatus } from "@/lib/api/events";
import { t, DEFAULT_LOCALE, type Locale, type TranslationKey } from "@/lib/i18n/translations";

const CONFIG: Record<RsvpStatus, { labelKey: TranslationKey; icon: typeof Check; className: string }> = {
  yes: { labelKey: "rsvp.statusYes", icon: Check, className: "bg-success-foreground text-success" },
  no: { labelKey: "rsvp.statusNo", icon: X, className: "bg-error-foreground text-error" },
  pending: { labelKey: "rsvp.statusPending", icon: CircleDashed, className: "bg-surface-2 text-muted-foreground" },
};

export function RsvpStatusBadge({ status, locale = DEFAULT_LOCALE }: { status: RsvpStatus; locale?: Locale }) {
  const { labelKey, icon: Icon, className } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {t(locale, labelKey)}
    </span>
  );
}
