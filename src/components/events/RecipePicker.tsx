"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChefHat, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { chooseRecipe } from "@/lib/api/events";
import type { RecipeOption } from "@/lib/api/recipes";
import { fileUrl } from "@/lib/pocketbase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RecipePicker({
  eventId,
  options,
  attendeeCount,
}: {
  eventId: string;
  options: RecipeOption[];
  attendeeCount: number;
}) {
  const { pb } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true);
    try {
      await chooseRecipe(pb, eventId, selected);
      toast.success("Recept gekozen.");
      router.refresh();
    } catch {
      toast.error("Geen verbinding. Probeer het nog eens.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <h2 className="text-title-3 font-heading font-bold">Kies het recept</h2>
        <p className="text-caption text-muted-foreground mt-1">
          {attendeeCount > 0
            ? `Op basis van de dieetwensen en allergieën van ${attendeeCount} ${attendeeCount === 1 ? "aanmelding" : "aanmeldingen"}.`
            : "Nog niemand heeft gereageerd — wacht op de RSVP's voor het beste advies, of kies nu al."}
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {options.map(({ recipe, conflicts }) => {
          const imageUrl = fileUrl(recipe, recipe.image, "recipes");
          const isSelected = selected === recipe.id;
          return (
            <li key={recipe.id}>
              <button
                type="button"
                onClick={() => setSelected(recipe.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors",
                  isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-surface-2"
                )}
              >
                <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg bg-surface-2">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={recipe.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ChefHat className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-label">{recipe.title}</span>
                  {conflicts.length === 0 ? (
                    <span className="text-caption text-success">Geen conflicten</span>
                  ) : (
                    <span className="text-caption text-warning">
                      Conflict bij {conflicts.map((c) => c.userName).join(", ")}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="h-5 w-5 flex-none text-primary" strokeWidth={2.5} />}
              </button>
            </li>
          );
        })}
      </ul>
      <Button onClick={handleConfirm} disabled={!selected || loading} className="mt-1">
        {loading ? "Bezig..." : "Dit wordt het"}
      </Button>
    </div>
  );
}
