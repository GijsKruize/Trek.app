import type PocketBase from "pocketbase";
import type { Ad, Recipe, RecipeIngredientExpanded, RecipeWithWarnings, TrekUser } from "@/lib/pocketbase/types";
import { computeAttendeeWarnings, computeDietWarnings } from "./diet";
import { isConfirmedAdult } from "./age";
import { AD_INTERVAL } from "@/lib/constants/feed";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export type FeedItem = { type: "recipe"; recipe: RecipeWithWarnings } | { type: "ad"; ad: Ad };

async function withDietWarnings(
  pb: PocketBase,
  recipe: Recipe,
  user: TrekUser | null,
  locale: Locale
): Promise<RecipeWithWarnings> {
  const ingredients = await pb.collection("recipe_ingredients").getFullList<RecipeIngredientExpanded>({
    filter: `recipe = "${recipe.id}"`,
    expand: "ingredient",
  });
  return { ...recipe, dietWarnings: computeDietWarnings(ingredients, user, locale) };
}

/** Fisher-Yates — the feed should feel different on every load, not stale
 * once you've scrolled past everything once. */
function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getFeed(
  pb: PocketBase,
  user: TrekUser | null,
  locale: Locale = DEFAULT_LOCALE
): Promise<FeedItem[]> {
  const [recipes, allAds] = await Promise.all([
    pb.collection("recipes").getFullList<Recipe>(),
    pb.collection("ads").getFullList<Ad>({ sort: "-sort_weight" }),
  ]);

  // Business plan §6.1/§10 "Responsible advertising": alcohol placements
  // only go to users who've confirmed they're 18+ — everyone else simply
  // never sees them, rather than a blurred/gated placeholder.
  const isAdult = isConfirmedAdult(user);
  const ads = allAds.filter((ad) => !ad.is_alcohol || isAdult);

  const recipesWithWarnings = await Promise.all(
    shuffle(recipes).map((recipe) => withDietWarnings(pb, recipe, user, locale))
  );

  const items: FeedItem[] = [];
  let adIndex = 0;
  recipesWithWarnings.forEach((recipe, index) => {
    items.push({ type: "recipe", recipe });
    if ((index + 1) % AD_INTERVAL === 0 && adIndex < ads.length) {
      items.push({ type: "ad", ad: ads[adIndex] });
      adIndex += 1;
    }
  });

  return items;
}

export async function getRecipeDetail(
  pb: PocketBase,
  id: string,
  user: TrekUser | null,
  locale: Locale = DEFAULT_LOCALE
) {
  const recipe = await pb.collection("recipes").getOne<Recipe>(id);
  const ingredients = await pb.collection("recipe_ingredients").getFullList<RecipeIngredientExpanded>({
    filter: `recipe = "${id}"`,
    expand: "ingredient",
    sort: "sort_order",
  });
  return {
    recipe: { ...recipe, dietWarnings: computeDietWarnings(ingredients, user, locale) } as RecipeWithWarnings,
    ingredients,
  };
}

export interface RecipeOption {
  recipe: Recipe;
  conflicts: ReturnType<typeof computeAttendeeWarnings>;
}

/** Every published recipe, annotated with which of the given attendees it
 * conflicts with — the organizer picks the meal once RSVPs (and therefore
 * the real guest list's diets/allergies) are known, not blind at creation
 * time. Sorted conflict-free first, then by fewest affected attendees. */
export async function getRecipeOptions(
  pb: PocketBase,
  attendees: Pick<TrekUser, "id" | "name" | "diet_tags" | "allergy_ingredients">[],
  locale: Locale = DEFAULT_LOCALE
): Promise<RecipeOption[]> {
  const recipes = await pb.collection("recipes").getFullList<Recipe>({ sort: "title" });
  const options = await Promise.all(
    recipes.map(async (recipe) => {
      const ingredients = await pb.collection("recipe_ingredients").getFullList<RecipeIngredientExpanded>({
        filter: `recipe = "${recipe.id}"`,
        expand: "ingredient",
      });
      return { recipe, conflicts: computeAttendeeWarnings(ingredients, attendees, locale) };
    })
  );
  return options.sort((a, b) => a.conflicts.length - b.conflicts.length);
}
