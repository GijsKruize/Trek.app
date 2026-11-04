import { getServerPocketBase } from "@/lib/pocketbase/server";
import type { Recipe } from "@/lib/pocketbase/types";
import { NewEventForm } from "./NewEventForm";

export default async function NewEventPage() {
  const pb = await getServerPocketBase();
  const recipes = await pb.collection("recipes").getFullList<Recipe>({ sort: "title" });

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-title-1 font-heading font-extrabold">Nieuw etentje</h1>
      <NewEventForm recipes={recipes} />
    </div>
  );
}
