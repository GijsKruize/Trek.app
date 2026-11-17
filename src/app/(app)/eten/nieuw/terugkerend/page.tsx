import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import { getMyGroups } from "@/lib/api/groups";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/translations";
import { NewSeriesForm } from "./NewSeriesForm";

export default async function NewSeriesPage() {
  const pb = await getServerPocketBase();
  const user = await getCurrentUser();
  const locale = await getLocale();
  const myGroups = user ? await getMyGroups(pb, user.id) : [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-title-1 font-heading font-extrabold">{t(locale, "seriesForm.title")}</h1>
      <p className="text-body text-muted-foreground">{t(locale, "seriesForm.subtitle")}</p>
      <NewSeriesForm groups={myGroups.map((g) => g.group)} locale={locale} />
    </div>
  );
}
