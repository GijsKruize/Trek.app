import type { IngredientTag } from "@/lib/pocketbase/types";
import type { Locale } from "@/lib/i18n/translations";

export const INGREDIENT_TAGS: IngredientTag[] = [
  "noten",
  "pinda",
  "zuivel",
  "lactose",
  "gluten",
  "ei",
  "vis",
  "schaaldieren",
  "soja",
  "vlees",
  "varkensvlees",
  "rundvlees",
  "pluimvee",
  "peulvruchten",
  "alcohol",
  "honing",
];

export const INGREDIENT_TAG_LABELS: Record<IngredientTag, string> = {
  noten: "noten",
  pinda: "pinda's",
  zuivel: "zuivel",
  lactose: "lactose",
  gluten: "gluten",
  ei: "ei",
  vis: "vis",
  schaaldieren: "schaaldieren",
  soja: "soja",
  vlees: "vlees",
  varkensvlees: "varkensvlees",
  rundvlees: "rundvlees",
  pluimvee: "pluimvee",
  peulvruchten: "peulvruchten",
  alcohol: "alcohol",
  honing: "honing",
};

export const INGREDIENT_TAG_LABELS_EN: Record<IngredientTag, string> = {
  noten: "nuts",
  pinda: "peanuts",
  zuivel: "dairy",
  lactose: "lactose",
  gluten: "gluten",
  ei: "egg",
  vis: "fish",
  schaaldieren: "shellfish",
  soja: "soy",
  vlees: "meat",
  varkensvlees: "pork",
  rundvlees: "beef",
  pluimvee: "poultry",
  peulvruchten: "legumes",
  alcohol: "alcohol",
  honing: "honey",
};

export function getIngredientTagLabel(tag: IngredientTag, locale: Locale): string {
  return locale === "en" ? INGREDIENT_TAG_LABELS_EN[tag] : INGREDIENT_TAG_LABELS[tag];
}
