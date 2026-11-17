import { Megaphone } from "lucide-react";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

/** Sponsored content always uses Blauwbes (info) + an explicit label, so
 * it can never be mistaken for the brand or the group's match. */
export function SponsoredBadge({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-info-foreground px-2.5 py-1 text-caption text-info">
      <Megaphone className="h-3.5 w-3.5" strokeWidth={2.5} />
      {t(locale, "ad.sponsored")}
    </span>
  );
}
