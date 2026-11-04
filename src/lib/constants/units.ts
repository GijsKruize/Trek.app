import type { Unit } from "@/lib/pocketbase/types";

export const UNITS: Unit[] = [
  "gram",
  "kilogram",
  "ml",
  "liter",
  "stuk",
  "el",
  "tl",
  "snufje",
  "teentje",
  "bosje",
  "blik",
  "pak",
];

export const UNIT_LABELS: Record<Unit, string> = {
  gram: "gram",
  kilogram: "kg",
  ml: "ml",
  liter: "liter",
  stuk: "stuk",
  el: "eetlepel",
  tl: "theelepel",
  snufje: "snufje",
  teentje: "teentje",
  bosje: "bosje",
  blik: "blik",
  pak: "pak",
};
