import Link from "next/link";
import { Repeat } from "lucide-react";
import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import { getMyGroups } from "@/lib/api/groups";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/translations";
import { NewEventForm } from "./NewEventForm";

export default async function NewEventPage() {
  const pb = await getServerPocketBase();
  const user = await getCurrentUser();
  const locale = await getLocale();
  const myGroups = user ? await getMyGroups(pb, user.id) : [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-title-1 font-heading font-extrabold">{t(locale, "eten.newTitle")}</h1>
        <Link
          href="/eten/nieuw/terugkerend"
          className="inline-flex items-center gap-1 text-caption text-brand-text"
        >
          <Repeat className="h-3.5 w-3.5" />
          {t(locale, "eten.recurringSet")}
        </Link>
      </div>
      <NewEventForm groups={myGroups.map((g) => g.group)} locale={locale} />
    </div>
  );
}
