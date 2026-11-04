import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import type { Ingredient } from "@/lib/pocketbase/types";
import { DieetwensenForm } from "./DieetwensenForm";

export default async function DieetwensenPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const pb = await getServerPocketBase();
  const ingredients = await pb.collection("ingredients").getFullList<Ingredient>({ sort: "name" });

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-title-1 font-heading font-extrabold">Dieetwensen</h1>
      <p className="text-body text-muted-foreground">
        We laten je weten als een recept hier niet bij past — geen uitleg nodig.
      </p>
      <DieetwensenForm user={user} ingredients={ingredients} />
    </div>
  );
}
