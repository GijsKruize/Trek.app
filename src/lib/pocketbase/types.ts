export type DietTag =
  | "vegetarisch"
  | "vegan"
  | "glutenvrij"
  | "lactosevrij"
  | "halal"
  | "kosjer"
  | "pescotarisch";

export type IngredientTag =
  | "noten"
  | "pinda"
  | "zuivel"
  | "lactose"
  | "gluten"
  | "ei"
  | "vis"
  | "schaaldieren"
  | "soja"
  | "vlees"
  | "varkensvlees"
  | "rundvlees"
  | "pluimvee"
  | "peulvruchten"
  | "alcohol"
  | "honing";

export type Unit =
  | "gram"
  | "kilogram"
  | "ml"
  | "liter"
  | "stuk"
  | "el"
  | "tl"
  | "snufje"
  | "teentje"
  | "bosje"
  | "blik"
  | "pak";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface BaseRecord {
  id: string;
  created?: string;
  updated?: string;
  collectionId?: string;
  collectionName?: string;
}

export interface TrekUser extends BaseRecord {
  email: string;
  name: string;
  avatar: string;
  diet_tags: DietTag[];
  allergy_ingredients: string[];
}

export interface Group extends BaseRecord {
  name: string;
  address: string;
  image: string;
  admins: string[];
}

export interface GroupMember extends BaseRecord {
  group: string;
  user: string;
  role: "admin" | "member";
}

export interface GroupInvite extends BaseRecord {
  group: string;
  code: string;
  created_by: string;
  max_uses: number;
  uses_count: number;
  expires_at: string;
  revoked: boolean;
}

export interface Ingredient extends BaseRecord {
  name: string;
  tags: IngredientTag[];
  unit_default?: Unit;
}

export interface Recipe extends BaseRecord {
  title: string;
  description: string;
  image: string;
  servings: number;
  instructions: string;
  prep_minutes: number;
  is_published: boolean;
}

export interface RecipeIngredient extends BaseRecord {
  recipe: string;
  ingredient: string;
  quantity: number;
  unit: Unit;
  note: string;
  sort_order: number;
}

export interface RecipeIngredientExpanded extends RecipeIngredient {
  expand?: { ingredient: Ingredient };
}

export interface Ad extends BaseRecord {
  title: string;
  teaser: string;
  image: string;
  link_url: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
  sort_weight: number;
}

export interface EventSeries extends BaseRecord {
  group: string;
  organizer: string;
  title: string;
  default_recipe: string;
  default_location: string;
  rrule_freq: "weekly" | "biweekly" | "monthly";
  rrule_byweekday: Weekday;
  start_time: string;
  start_date: string;
  end_date: string;
  cook_rotation_enabled: boolean;
  cook_rotation_order: string[];
  cook_rotation_pointer: number;
  surprise_default: boolean;
  active: boolean;
}

export interface TrekEvent extends BaseRecord {
  series: string;
  group: string;
  organizer: string;
  invitees: string[];
  title: string;
  starts_at: string;
  location: string;
  cook: string;
  is_surprise: boolean;
  revealed_at: string;
  total_cost_cents: number;
  status: "scheduled" | "cancelled";
  share_token: string;
}

export interface EventMeal extends BaseRecord {
  event: string;
  recipe: string;
}

export interface ShoppingListItem extends BaseRecord {
  event: string;
  ingredient: string;
  custom_label: string;
  quantity: number;
  unit: Unit;
  checked: boolean;
  added_by: string;
}

export interface Rsvp extends BaseRecord {
  event: string;
  user: string;
  guest_name: string;
  status: "yes" | "no";
}

/** A recipe annotated with this viewer's dietary conflicts — computed
 * server-side once in lib/api, never recomputed in presentational
 * components. */
export interface DietWarning {
  kind: "diet" | "allergy";
  label: string;
}

export interface RecipeWithWarnings extends Recipe {
  dietWarnings: DietWarning[];
}
