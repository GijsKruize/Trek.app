import { Receipt } from "lucide-react";
import { computeShareCents, formatEuroCents } from "@/lib/costSplit";

export function CostSplitDisplay({
  totalCostCents,
  yesCount,
}: {
  totalCostCents: number;
  yesCount: number;
}) {
  if (totalCostCents <= 0) return null;
  const shareCents = computeShareCents(totalCostCents, Math.max(yesCount, 1));

  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-3">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-label font-semibold">{formatEuroCents(totalCostCents)} totaal</p>
          <p className="text-caption text-muted-foreground">
            Gedeeld door {yesCount} {yesCount === 1 ? "persoon" : "mensen"}
          </p>
        </div>
      </div>
      <p className="text-title-3 font-heading font-bold text-brand-text">
        {formatEuroCents(shareCents)}
        <span className="text-caption font-sans font-normal text-muted-foreground"> p.p.</span>
      </p>
    </div>
  );
}
