import type PocketBase from "pocketbase";
import type { Ad, Recipe, RecipeIngredientExpanded, RecipeWithWarnings, TrekUser } from "@/lib/pocketbase/types";
import { computeAttendeeWarnings, computeDietWarnings } from "./diet";
import { AD_INTERVAL } from "@/lib/constants/feed";

export type FeedItem = { type: "recipe"; recipe: RecipeWithWarnings } | { type: "ad"; ad: Ad };

async function withDietWarnings(
  pb: PocketBase,
  recipe: Recipe,
  user: TrekUser | null
): Promise<RecipeWithWarnings> {
  const ingredients = await pb.collection("recipe_ingredients").getFullList<RecipeIngredientExpanded>({
    filter: `recipe = "${recipe.id}"`,
    expand: "ingredient",
  });
  return { ...recipe, dietWarnings: computeDietWarnings(ingredients, user) };
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

export async function getFeed(pb: PocketBase, user: TrekUser | null): Promise<FeedItem[]> {
  const [recipes, ads] = await Promise.all([
    pb.collection("recipes").getFullList<Recipe>(),
    pb.collection("ads").getFullList<Ad>({ sort: "-sort_weight" }),
  ]);

  const recipesWithWarnings = await Promise.all(shuffle(recipes).map((recipe) => withDietWarnings(pb, recipe, user)));

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

export async function getRecipeDetail(pb: PocketBase, id: string, user: TrekUser | null) {
  const recipe = await pb.collection("recipes").getOne<Recipe>(id);
  const ingredients = await pb.collection("recipe_ingredients").getFullList<RecipeIngredientExpanded>({
    filter: `recipe = "${id}"`,
    expand: "ingredient",
    sort: "sort_order",
  });
  return {
    recipe: { ...recipe, dietWarnings: computeDietWarnings(ingredients, user) } as RecipeWithWarnings,
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
  attendees: Pick<TrekUser, "id" | "name" | "diet_tags" | "allergy_ingredients">[]
): Promise<RecipeOption[]> {
  const recipes = await pb.collection("recipes").getFullList<Recipe>({ sort: "title" });
  const options = await Promise.all(
    recipes.map(async (recipe) => {
      const ingredients = await pb.collection("recipe_ingredients").getFullList<RecipeIngredientExpanded>({
        filter: `recipe = "${recipe.id}"`,
        expand: "ingredient",
      });
      return { recipe, conflicts: computeAttendeeWarnings(ingredients, attendees) };
    })
  );
  return options.sort((a, b) => a.conflicts.length - b.conflicts.length);
}
