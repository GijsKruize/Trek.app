"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { Ingredient, TrekUser, DietTag } from "@/lib/pocketbase/types";
import { DIET_TAGS, getDietTagLabel } from "@/lib/constants/dietTags";
import { DietTagChip } from "@/components/badges/DietTagChip";
import { Button } from "@/components/ui/button";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export function DieetwensenForm({
  user,
  ingredients,
  locale = DEFAULT_LOCALE,
}: {
  user: TrekUser;
  ingredients: Ingredient[];
  locale?: Locale;
}) {
  const { pb } = useAuth();
  const [dietTags, setDietTags] = useState<DietTag[]>(user.diet_tags ?? []);
  const [allergyIds, setAllergyIds] = useState<string[]>(user.allergy_ingredients ?? []);
  const [saving, setSaving] = useState(false);

  function toggleDiet(tag: DietTag) {
    setDietTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function toggleAllergy(id: string) {
    setAllergyIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await pb.collection("users").update(user.id, {
        diet_tags: dietTags,
        allergy_ingredients: allergyIds,
      });
      toast.success(t(locale, "diet.saved"));
    } catch {
      toast.error(t(locale, "common.networkError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">{t(locale, "diet.title")}</h2>
        <div className="flex flex-wrap gap-2">
          {DIET_TAGS.map((tag) => (
            <DietTagChip
              key={tag}
              label={getDietTagLabel(tag, locale)}
              selected={dietTags.includes(tag)}
              onClick={() => toggleDiet(tag)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">{t(locale, "diet.allergiesTitle")}</h2>
        <p className="text-caption text-muted-foreground">{t(locale, "diet.allergiesHelp")}</p>
        <div className="flex flex-wrap gap-2">
          {ingredients.map((ingredient) => (
            <DietTagChip
              key={ingredient.id}
              label={ingredient.name}
              selected={allergyIds.includes(ingredient.id)}
              onClick={() => toggleAllergy(ingredient.id)}
            />
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} size="lg">
        {saving ? t(locale, "common.busy") : t(locale, "common.save")}
      </Button>
    </div>
  );
}
