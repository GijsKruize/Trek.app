import Image from "next/image";
import { ChefHat } from "lucide-react";
import type { RecipeWithWarnings } from "@/lib/pocketbase/types";
import { fileUrl } from "@/lib/pocketbase/client";
import { WarningBadgeList } from "@/components/badges/WarningBadge";

export function RecipeCard({ recipe }: { recipe: RecipeWithWarnings }) {
  const imageUrl = fileUrl(recipe, recipe.image, "recipes");

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-[4/3] w-full bg-surface-2">
        {imageUrl ? (
          <Image src={imageUrl} alt={recipe.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ChefHat className="h-10 w-10" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="text-title-3 font-heading font-bold">{recipe.title}</h3>
        {recipe.description && (
          <p className="text-body text-muted-foreground line-clamp-2">{recipe.description}</p>
        )}
        <div className="flex items-center gap-3 text-caption text-muted-foreground">
          <span>{recipe.servings} personen</span>
          {recipe.prep_minutes > 0 && <span>· {recipe.prep_minutes} min</span>}
        </div>
        <WarningBadgeList warnings={recipe.dietWarnings} />
      </div>
    </article>
  );
}
