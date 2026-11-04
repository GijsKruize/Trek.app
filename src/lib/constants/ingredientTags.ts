import type { IngredientTag } from "@/lib/pocketbase/types";

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
