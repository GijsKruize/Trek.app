import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import { getFeed } from "@/lib/api/recipes";
import { RecipeCard } from "@/components/cards/RecipeCard";
import { AdCard } from "@/components/cards/AdCard";
import { Soup } from "lucide-react";

export default async function FeedPage() {
  const pb = await getServerPocketBase();
  const user = await getCurrentUser();
  const items = await getFeed(pb, user);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-title-1 font-heading font-extrabold">Trek?</h1>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Soup className="h-10 w-10" strokeWidth={1.5} />
          <p className="text-body">Nog geen recepten. Vraag je huisgenoten wat ze willen eten.</p>
        </div>
      ) : (
        items.map((item) =>
          item.type === "recipe" ? (
            <RecipeCard key={`recipe-${item.recipe.id}`} recipe={item.recipe} />
          ) : (
            <AdCard key={`ad-${item.ad.id}`} ad={item.ad} />
          )
        )
      )}
    </div>
  );
}
