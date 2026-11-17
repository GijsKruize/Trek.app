import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import type { Ingredient } from "@/lib/pocketbase/types";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/translations";
import { DieetwensenForm } from "./DieetwensenForm";

export default async function DieetwensenPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const pb = await getServerPocketBase();
  const locale = await getLocale();
  const ingredients = await pb.collection("ingredients").getFullList<Ingredient>({ sort: "name" });

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-title-1 font-heading font-extrabold">{t(locale, "dieetwensen.title")}</h1>
      <p className="text-body text-muted-foreground">{t(locale, "dieetwensen.subtitle")}</p>
      <DieetwensenForm user={user} ingredients={ingredients} locale={locale} />
    </div>
  );
}
