"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOff, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { revealMeal } from "@/lib/api/events";
import { Button } from "@/components/ui/button";

export function SurpriseGate({
  eventId,
  canReveal,
  isCook,
}: {
  eventId: string;
  canReveal: boolean;
  isCook: boolean;
}) {
  const { pb } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReveal() {
    setLoading(true);
    try {
      await revealMeal(pb, eventId);
      toast.success("Onthuld. Trek? Jullie match staat klaar.");
      router.refresh();
    } catch {
      toast.error("Geen verbinding. Probeer het nog eens.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-2 p-6 text-center">
      <EyeOff className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
      <div>
        <p className="text-title-3 font-heading font-bold">Verrassing?</p>
        <p className="text-body text-muted-foreground mt-1">
          {isCook
            ? "Jij bent de kok — jij ziet het recept altijd al."
            : "Niemand ziet het recept tot het onthuld wordt of het etentje begint."}
        </p>
      </div>
      {canReveal && (
        <Button onClick={handleReveal} disabled={loading} className="mt-1">
          <Sparkles className="h-4 w-4" />
          {loading ? "Bezig..." : "Nu onthullen"}
        </Button>
      )}
    </div>
  );
}
