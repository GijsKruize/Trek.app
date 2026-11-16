import { notFound } from "next/navigation";
import Image from "next/image";
import { ChefHat, Clock, Users } from "lucide-react";
import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import { getRecipeDetail } from "@/lib/api/recipes";
import { fileUrl } from "@/lib/pocketbase/client";
import { WarningBadgeList } from "@/components/badges/WarningBadge";
import { INGREDIENT_TAG_LABELS } from "@/lib/constants/ingredientTags";
import { UNIT_LABELS } from "@/lib/constants/units";

/** The seed/editorial content writes instructions as full sentences
 * separated by ". " — split them into numbered steps for the recipe
 * page rather than showing one unbroken paragraph. */
function splitInstructionsIntoSteps(instructions: string): string[] {
  return instructions
    .split(/(?<=[.!?])\s+/)
    .map((step) => step.trim())
    .filter(Boolean);
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const pb = await getServerPocketBase();
  const user = await getCurrentUser();

  let detail;
  try {
    detail = await getRecipeDetail(pb, recipeId, user);
  } catch {
    notFound();
  }

  const { recipe, ingredients } = detail;
  const imageUrl = fileUrl(recipe, recipe.image, "recipes");
  const steps = splitInstructionsIntoSteps(recipe.instructions);

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-2">
        {imageUrl ? (
          <Image src={imageUrl} alt={recipe.title} fill className="object-cover" priority />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ChefHat className="h-12 w-12" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-title-1 font-heading font-extrabold">{recipe.title}</h1>
        {recipe.description && <p className="text-body text-muted-foreground">{recipe.description}</p>}
        <div className="flex items-center gap-4 text-caption text-muted-foreground">
          {recipe.servings > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {recipe.servings} personen
            </span>
          )}
          {recipe.prep_minutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {recipe.prep_minutes} min
            </span>
          )}
        </div>
        <WarningBadgeList warnings={recipe.dietWarnings} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">Ingrediënten</h2>
        <ul className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4">
          {ingredients.map((ri) => (
            <li key={ri.id} className="flex items-center justify-between gap-3 py-1.5 text-body">
              <span>
                {ri.expand?.ingredient?.name ?? "Ingrediënt"}
                {ri.note && <span className="text-muted-foreground"> ({ri.note})</span>}
              </span>
              <span className="whitespace-nowrap text-muted-foreground">
                {ri.quantity} {UNIT_LABELS[ri.unit]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {ingredients.some((ri) => (ri.expand?.ingredient?.tags ?? []).length > 0) && (
        <div className="flex flex-col gap-2">
          <h2 className="text-title-3 font-heading font-bold">Allergenen &amp; kenmerken</h2>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(
              new Set(ingredients.flatMap((ri) => ri.expand?.ingredient?.tags ?? []))
            ).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-caption font-medium text-muted-foreground"
              >
                {INGREDIENT_TAG_LABELS[tag]}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">Bereiding</h2>
        <ol className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-caption font-bold text-on-primary">
                {i + 1}
              </span>
              <p className="text-body pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
