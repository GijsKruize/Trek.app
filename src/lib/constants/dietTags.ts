import type { DietTag, IngredientTag } from "@/lib/pocketbase/types";
import type { Locale } from "@/lib/i18n/translations";

export const DIET_TAGS: DietTag[] = [
  "vegetarisch",
  "vegan",
  "glutenvrij",
  "lactosevrij",
  "halal",
  "kosjer",
  "pescotarisch",
];

export const DIET_TAG_LABELS: Record<DietTag, string> = {
  vegetarisch: "Vegetarisch",
  vegan: "Vegan",
  glutenvrij: "Glutenvrij",
  lactosevrij: "Lactosevrij",
  halal: "Halal",
  kosjer: "Koosjer",
  pescotarisch: "Pescotarisch",
};

export const DIET_TAG_LABELS_EN: Record<DietTag, string> = {
  vegetarisch: "Vegetarian",
  vegan: "Vegan",
  glutenvrij: "Gluten-free",
  lactosevrij: "Lactose-free",
  halal: "Halal",
  kosjer: "Kosher",
  pescotarisch: "Pescatarian",
};

export function getDietTagLabel(tag: DietTag, locale: Locale): string {
  return locale === "en" ? DIET_TAG_LABELS_EN[tag] : DIET_TAG_LABELS[tag];
}

/** Which ingredient tags a diet wish excludes. This is a product
 * decision, not content, so it lives in code rather than a PocketBase
 * collection — see docs/schema.md. */
export const DIET_EXCLUDES_INGREDIENT_TAGS: Record<DietTag, IngredientTag[]> = {
  vegetarisch: ["vlees", "varkensvlees", "rundvlees", "pluimvee", "vis", "schaaldieren"],
  vegan: ["vlees", "varkensvlees", "rundvlees", "pluimvee", "vis", "schaaldieren", "zuivel", "lactose", "ei", "honing"],
  glutenvrij: ["gluten"],
  lactosevrij: ["zuivel", "lactose"],
  halal: ["varkensvlees", "alcohol"],
  kosjer: ["varkensvlees", "schaaldieren"],
  pescotarisch: ["vlees", "varkensvlees", "rundvlees", "pluimvee"],
};
