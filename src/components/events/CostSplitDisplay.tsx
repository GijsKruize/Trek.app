import { Receipt } from "lucide-react";
import { computeShareCents, formatEuroCents } from "@/lib/costSplit";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export function CostSplitDisplay({
  totalCostCents,
  yesCount,
  locale = DEFAULT_LOCALE,
}: {
  totalCostCents: number;
  yesCount: number;
  locale?: Locale;
}) {
  if (totalCostCents <= 0) return null;
  const shareCents = computeShareCents(totalCostCents, Math.max(yesCount, 1));
  const peopleLabel = t(locale, yesCount === 1 ? "common.person" : "common.people");

  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-label">{t(locale, "cost.total", { amount: formatEuroCents(totalCostCents) })}</p>
          <p className="text-caption text-muted-foreground">
            {t(locale, "cost.sharedBy", { count: yesCount, label: peopleLabel })}
          </p>
        </div>
      </div>
      <p className="text-title-3 font-heading font-bold text-brand-text">
        {formatEuroCents(shareCents)}
        <span className="text-caption font-sans font-normal text-muted-foreground">{t(locale, "cost.perPerson")}</span>
      </p>
    </div>
  );
}
