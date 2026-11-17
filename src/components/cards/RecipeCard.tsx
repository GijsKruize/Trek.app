import Image from "next/image";
import Link from "next/link";
import { ChefHat } from "lucide-react";
import type { RecipeWithWarnings } from "@/lib/pocketbase/types";
import { fileUrl } from "@/lib/pocketbase/client";
import { WarningBadgeList } from "@/components/badges/WarningBadge";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export function RecipeCard({ recipe, locale = DEFAULT_LOCALE }: { recipe: RecipeWithWarnings; locale?: Locale }) {
  const imageUrl = fileUrl(recipe, recipe.image, "recipes");

  return (
    <Link
      href={`/recepten/${recipe.id}`}
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
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
          <span>{t(locale, "recipe.servings", { count: recipe.servings })}</span>
          {recipe.prep_minutes > 0 && <span>· {t(locale, "recipe.minutes", { count: recipe.prep_minutes })}</span>}
        </div>
        <WarningBadgeList warnings={recipe.dietWarnings} />
      </div>
    </Link>
  );
}
