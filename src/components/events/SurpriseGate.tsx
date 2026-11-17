"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOff, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { revealMeal } from "@/lib/api/events";
import { Button } from "@/components/ui/button";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export function SurpriseGate({
  eventId,
  canReveal,
  isCook,
  locale = DEFAULT_LOCALE,
}: {
  eventId: string;
  canReveal: boolean;
  isCook: boolean;
  locale?: Locale;
}) {
  const { pb } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReveal() {
    setLoading(true);
    try {
      await revealMeal(pb, eventId);
      toast.success(t(locale, "surprise.revealed"));
      router.refresh();
    } catch {
      toast.error(t(locale, "common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-2 p-6 text-center">
      <EyeOff className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      <div>
        <p className="text-title-3 font-heading font-bold">{t(locale, "surprise.title")}</p>
        <p className="text-body text-muted-foreground mt-1">
          {isCook ? t(locale, "surprise.isCook") : t(locale, "surprise.notCook")}
        </p>
      </div>
      {canReveal && (
        <Button onClick={handleReveal} disabled={loading} className="mt-1">
          <Sparkles className="h-4 w-4" />
          {loading ? t(locale, "common.busy") : t(locale, "surprise.revealNow")}
        </Button>
      )}
    </div>
  );
}
