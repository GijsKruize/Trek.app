import type { DietWarning, IngredientTag, RecipeIngredientExpanded, TrekUser } from "@/lib/pocketbase/types";
import { DIET_EXCLUDES_INGREDIENT_TAGS } from "@/lib/constants/dietTags";
import { getIngredientTagLabel } from "@/lib/constants/ingredientTags";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

/** The single implementation of "does this recipe conflict with this
 * user's dietary wishes/allergies" — badges stay purely presentational
 * and just render whatever this returns. Run server-side in lib/api so
 * there's exactly one place this rule lives. The ingredient/allergen
 * names themselves stay in their original (seeded) language — only the
 * "contains ..." wrapper phrase and the fixed ingredient-tag labels are
 * localized, since the ingredient names are content, not UI chrome. */
export function computeDietWarnings(
  recipeIngredients: RecipeIngredientExpanded[],
  user: Pick<TrekUser, "diet_tags" | "allergy_ingredients"> | null,
  locale: Locale = DEFAULT_LOCALE
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
        warnings.push({ kind: "diet", label: t(locale, "diet.contains", { item: getIngredientTagLabel(tag, locale) }) });
      }
    }
  }

  const allergyIds = new Set(user.allergy_ingredients ?? []);
  const seenIngredients = new Set<string>();
  for (const ri of recipeIngredients) {
    const ingredient = ri.expand?.ingredient;
    if (ingredient && allergyIds.has(ingredient.id) && !seenIngredients.has(ingredient.id)) {
      seenIngredients.add(ingredient.id);
      warnings.push({ kind: "allergy", label: t(locale, "diet.contains", { item: ingredient.name.toLowerCase() }) });
    }
  }

  return warnings;
}

/** One attendee's conflicts with a candidate recipe, for the
 * post-RSVP recipe picker (see events.ts `getRecipeOptionsForEvent`). */
export interface AttendeeWarning {
  userId: string;
  userName: string;
  warnings: DietWarning[];
}

/** Same conflict rule as `computeDietWarnings`, run once per attendee and
 * collapsed to only those who actually have a conflict — the picker shows
 * "safe for everyone" vs. "conflicts with Tom, Femke" rather than a wall
 * of empty rows. */
export function computeAttendeeWarnings(
  recipeIngredients: RecipeIngredientExpanded[],
  attendees: Pick<TrekUser, "id" | "name" | "diet_tags" | "allergy_ingredients">[],
  locale: Locale = DEFAULT_LOCALE
): AttendeeWarning[] {
  return attendees
    .map((attendee) => ({
      userId: attendee.id,
      userName: attendee.name,
      warnings: computeDietWarnings(recipeIngredients, attendee, locale),
    }))
    .filter((entry) => entry.warnings.length > 0);
}
