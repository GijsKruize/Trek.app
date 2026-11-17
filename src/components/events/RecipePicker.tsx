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
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export function RecipePicker({
  eventId,
  options,
  attendeeCount,
  locale = DEFAULT_LOCALE,
}: {
  eventId: string;
  options: RecipeOption[];
  attendeeCount: number;
  locale?: Locale;
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
      toast.success(t(locale, "recipePicker.chosen"));
      router.refresh();
    } catch {
      toast.error(t(locale, "common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <h2 className="text-title-3 font-heading font-bold">{t(locale, "recipePicker.title")}</h2>
        <p className="text-caption text-muted-foreground mt-1">
          {attendeeCount > 0
            ? t(locale, "recipePicker.helpWithCount", {
                count: attendeeCount,
                label: t(locale, attendeeCount === 1 ? "recipePicker.rsvpWord1" : "recipePicker.rsvpWordMany"),
              })
            : t(locale, "recipePicker.helpNoCount")}
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
                    <span className="text-caption text-success">{t(locale, "recipePicker.noConflicts")}</span>
                  ) : (
                    <span className="text-caption text-warning">
                      {t(locale, "recipePicker.conflictWith", { names: conflicts.map((c) => c.userName).join(", ") })}
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
        {loading ? t(locale, "common.busy") : t(locale, "recipePicker.confirm")}
      </Button>
    </div>
  );
}
