import type { DietWarning, IngredientTag, RecipeIngredientExpanded, TrekUser } from "@/lib/pocketbase/types";
import { DIET_EXCLUDES_INGREDIENT_TAGS } from "@/lib/constants/dietTags";
import { INGREDIENT_TAG_LABELS } from "@/lib/constants/ingredientTags";

/** The single implementation of "does this recipe conflict with this
 * user's dietary wishes/allergies" — badges stay purely presentational
 * and just render whatever this returns. Run server-side in lib/api so
 * there's exactly one place this rule lives. */
export function computeDietWarnings(
  recipeIngredients: RecipeIngredientExpanded[],
  user: Pick<TrekUser, "diet_tags" | "allergy_ingredients"> | null
): DietWarning[] {
  if (!user) return [];

  const warnings: DietWarning[] = [];

  const excludedTags = new Set<IngredientTag>();
  for (const dietTag of user.diet_tags ?? []) {
    for (const tag of DIET_EXCLUDES_INGREDIENT_TAGS[dietTag] ?? []) {
      excludedTags.add(tag);
    }
  }

  const seenTags = new Set<string>();
  for (const ri of recipeIngredients) {
    for (const tag of ri.expand?.ingredient?.tags ?? []) {
      if (excludedTags.has(tag) && !seenTags.has(tag)) {
        seenTags.add(tag);
        warnings.push({ kind: "diet", label: `bevat ${INGREDIENT_TAG_LABELS[tag]}` });
      }
    }
  }

  const allergyIds = new Set(user.allergy_ingredients ?? []);
  const seenIngredients = new Set<string>();
  for (const ri of recipeIngredients) {
    const ingredient = ri.expand?.ingredient;
    if (ingredient && allergyIds.has(ingredient.id) && !seenIngredients.has(ingredient.id)) {
      seenIngredients.add(ingredient.id);
      warnings.push({ kind: "allergy", label: `bevat ${ingredient.name.toLowerCase()}` });
    }
  }

  return warnings;
}
