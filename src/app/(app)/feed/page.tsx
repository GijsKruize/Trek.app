import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import { getFeed } from "@/lib/api/recipes";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/translations";
import { RecipeCard } from "@/components/cards/RecipeCard";
import { AdCard } from "@/components/cards/AdCard";
import { Soup } from "lucide-react";

export default async function FeedPage() {
  const pb = await getServerPocketBase();
  const user = await getCurrentUser();
  const locale = await getLocale();
  const items = await getFeed(pb, user, locale);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-title-1 font-heading font-extrabold">{t(locale, "feed.title")}</h1>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Soup className="h-10 w-10" strokeWidth={1.5} />
          <p className="text-body">{t(locale, "feed.empty")}</p>
        </div>
      ) : (
        items.map((item) =>
          item.type === "recipe" ? (
            <RecipeCard key={`recipe-${item.recipe.id}`} recipe={item.recipe} locale={locale} />
          ) : (
            <AdCard key={`ad-${item.ad.id}`} ad={item.ad} locale={locale} />
          )
        )
      )}
    </div>
  );
}
