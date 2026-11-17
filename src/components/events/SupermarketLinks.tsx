import { ShoppingCart } from "lucide-react";
import type { ShoppingListItemExpanded } from "@/lib/pocketbase/types";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

/**
 * Recipe-to-basket deep links (business plan §5.2 "Should Have" / §6.2 —
 * the technical hook for commission revenue). Real "add to basket" APIs
 * are behind each retailer's affiliate/partner programme (Picnic, AH
 * Voordeelshop) which we only get access to after a signed letter of
 * intent (§6.2 "Validation step") — until then this opens the group's
 * list as a search in each webshop, which is the honest MVP of "one tap
 * to the supermarket" without pretending to inject a real cart.
 *
 * `ref` is a placeholder affiliate/tracking tag — swap for the real
 * partner id once a supermarket signs on (§6.2/§6.3).
 */
const SUPERMARKETS = [
  {
    id: "ah",
    name: "Albert Heijn",
    buildUrl: (query: string) => `https://www.ah.nl/zoeken?query=${encodeURIComponent(query)}&ref=trekapp`,
  },
  {
    id: "jumbo",
    name: "Jumbo",
    buildUrl: (query: string) =>
      `https://www.jumbo.com/zoeken?searchTerms=${encodeURIComponent(query)}&ref=trekapp`,
  },
  {
    id: "picnic",
    name: "Picnic",
    buildUrl: () => `https://picnic.app/nl/link/trekapp`,
  },
] as const;

export function SupermarketLinks({
  items,
  locale = DEFAULT_LOCALE,
}: {
  items: ShoppingListItemExpanded[];
  locale?: Locale;
}) {
  const openItems = items.filter((i) => !i.checked);
  if (openItems.length === 0) return null;

  const query = openItems
    .map((i) => i.expand?.ingredient?.name || i.custom_label)
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
      <p className="flex items-center gap-2 text-caption font-medium text-muted-foreground">
        <ShoppingCart className="h-4 w-4" />
        {t(locale, "supermarket.heading")}
      </p>
      <div className="flex flex-wrap gap-2">
        {SUPERMARKETS.map((market) => (
          <a
            key={market.id}
            href={market.buildUrl(query)}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 rounded-full border border-border bg-surface-2 px-4 py-2 text-caption font-medium"
          >
            {market.name}
          </a>
        ))}
      </div>
    </div>
  );
}
