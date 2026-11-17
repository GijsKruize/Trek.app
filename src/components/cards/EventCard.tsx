import Link from "next/link";
import { MapPin, Users, EyeOff } from "lucide-react";
import type { UpcomingEvent } from "@/lib/api/events";
import { RsvpStatusBadge } from "@/components/badges/RsvpStatusBadge";
import { t, dateLocaleTag, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export function EventCard({ upcoming, locale = DEFAULT_LOCALE }: { upcoming: UpcomingEvent; locale?: Locale }) {
  const { event, myStatus } = upcoming;
  const dateFormatter = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const title = event.is_surprise && !event.revealed_at ? t(locale, "eten.surpriseMeal") : event.title || t(locale, "eten.meal");
  const groupName = event.expand?.group?.name;
  const organizerName = event.expand?.organizer?.name;

  return (
    <Link
      href={`/eten/${event.id}`}
      className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-overline uppercase text-brand-text">
            {dateFormatter.format(new Date(event.starts_at))}
          </span>
          <h3 className="flex items-center gap-1.5 text-title-3 font-heading font-bold">
            {event.is_surprise && !event.revealed_at && <EyeOff className="h-4 w-4 text-muted-foreground" />}
            {title}
          </h3>
        </div>
        <RsvpStatusBadge status={myStatus} locale={locale} />
      </div>
      <div className="flex flex-wrap gap-3 text-caption text-muted-foreground">
        {groupName ? (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {groupName}
          </span>
        ) : (
          organizerName && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {organizerName}
            </span>
          )
        )}
        {event.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </span>
        )}
      </div>
    </Link>
  );
}
