/** Equal split, computed on read — never stored, so it stays correct as
 * RSVPs change. Rounded per-share for display only; the brief calls for
 * informal cost-splitting, not a reconciled ledger. */
export function computeShareCents(totalCostCents: number, participantCount: number): number {
  if (participantCount <= 0) return 0;
  return Math.round(totalCostCents / participantCount);
}

export function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}
