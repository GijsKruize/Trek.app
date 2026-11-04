import { Megaphone } from "lucide-react";

/** Sponsored content always uses Blauwbes (info) + an explicit label, so
 * it can never be mistaken for the brand or the group's match. */
export function SponsoredBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-info-foreground px-2.5 py-1 text-caption font-semibold text-info">
      <Megaphone className="h-3.5 w-3.5" strokeWidth={2.5} />
      Gesponsord
    </span>
  );
}
