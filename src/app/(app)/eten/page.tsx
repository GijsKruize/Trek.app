import Link from "next/link";
import { Plus, CalendarHeart } from "lucide-react";
import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import { getUpcomingEvents } from "@/lib/api/events";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/translations";
import { EventCard } from "@/components/cards/EventCard";
import { Button } from "@/components/ui/button";

export default async function EtenPage() {
  const pb = await getServerPocketBase();
  const user = await getCurrentUser();
  const locale = await getLocale();
  const upcoming = user ? await getUpcomingEvents(pb, user.id) : [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-title-1 font-heading font-extrabold">{t(locale, "eten.title")}</h1>
        <Button asChild size="sm">
          <Link href="/eten/nieuw">
            <Plus className="h-4 w-4" />
            {t(locale, "common.new")}
          </Link>
        </Button>
      </div>
      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <CalendarHeart className="h-10 w-10" strokeWidth={1.5} />
          <p className="text-body">{t(locale, "eten.empty")}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/eten/nieuw">{t(locale, "eten.planOne")}</Link>
          </Button>
        </div>
      ) : (
        upcoming.map((item) => <EventCard key={item.event.id} upcoming={item} locale={locale} />)
      )}
    </div>
  );
}
