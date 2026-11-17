import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, ChefHat } from "lucide-react";
import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import { getEventDetail } from "@/lib/api/events";
import { getRecipeOptions } from "@/lib/api/recipes";
import { fileUrl } from "@/lib/pocketbase/client";
import { getLocale } from "@/lib/i18n/server";
import { t, dateLocaleTag } from "@/lib/i18n/translations";
import { RsvpButtons } from "@/components/rsvp/RsvpButtons";
import { RsvpDeadlinePassed } from "@/components/rsvp/RsvpDeadlinePassed";
import { RsvpStatusBadge } from "@/components/badges/RsvpStatusBadge";
import { SurpriseGate } from "@/components/events/SurpriseGate";
import { RecipePicker } from "@/components/events/RecipePicker";
import { CostSplitDisplay } from "@/components/events/CostSplitDisplay";
import { ShoppingList } from "@/components/events/ShoppingList";
import { ShareLinkManager } from "@/components/events/ShareLinkManager";
import type { RsvpStatus } from "@/lib/api/events";
import type { TrekUser } from "@/lib/pocketbase/types";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const pb = await getServerPocketBase();
  const user = await getCurrentUser();
  const locale = await getLocale();

  const dateFormatter = new Intl.DateTimeFormat(dateLocaleTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  let detail;
  try {
    detail = await getEventDetail(pb, eventId, user?.id ?? null);
  } catch {
    notFound();
  }

  const { event, attendees, pendingMembers, recipe, revealed, shoppingList, myStatus, rsvpLocked } = detail;
  const groupAdmins = event.expand?.group?.admins ?? [];
  const isOrganizer = user?.id === event.organizer;
  const isCook = user?.id === event.cook;
  const isGroupAdmin = Boolean(user && groupAdmins.includes(user.id));
  const canManage = isOrganizer || isGroupAdmin;
  const yesCount = attendees.filter((a) => a.status === "yes").length;

  const recipeImageUrl = recipe ? fileUrl(recipe, recipe.image, "recipes") : "";

  // The organizer picks the meal once the real guest list (and therefore
  // its allergies/diets) is known — prefer confirmed "yes" attendees, but
  // fall back to the full invited group so there's still something useful
  // to show before any RSVPs are in.
  let recipeOptions: Awaited<ReturnType<typeof getRecipeOptions>> = [];
  let recipeAttendeeCount = 0;
  if (!recipe && canManage) {
    const yesUsers = attendees
      .filter((a) => a.status === "yes")
      .map((a) => a.expand?.user)
      .filter((u): u is TrekUser => !!u);
    const knownUsers = attendees.map((a) => a.expand?.user).filter((u): u is TrekUser => !!u);
    const candidateAttendees = yesUsers.length > 0 ? yesUsers : knownUsers.length > 0 ? knownUsers : pendingMembers;
    recipeAttendeeCount = yesUsers.length;
    recipeOptions = await getRecipeOptions(pb, candidateAttendees, locale);
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <p className="text-overline uppercase text-brand-text">
          {dateFormatter.format(new Date(event.starts_at))}
        </p>
        <h1 className="text-title-1 font-heading font-extrabold">
          {event.title ||
            (revealed && recipe ? recipe.title : event.is_surprise ? t(locale, "eten.surpriseMeal") : t(locale, "eten.meal"))}
        </h1>
        <div className="mt-2 flex flex-wrap gap-3 text-caption text-muted-foreground">
          {event.expand?.group?.name && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {event.expand.group.name}
            </span>
          )}
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          )}
          {event.expand?.cook?.name && (
            <span className="inline-flex items-center gap-1">
              <ChefHat className="h-3.5 w-3.5" />
              {t(locale, "eten.cooking", { name: event.expand.cook.name })}
            </span>
          )}
        </div>
      </div>

      {user &&
        (rsvpLocked ? (
          <RsvpDeadlinePassed organizer={event.expand?.organizer} locale={locale} />
        ) : (
          <RsvpButtons eventId={event.id} initialStatus={myStatus} locale={locale} />
        ))}

      {!recipe && canManage ? (
        <RecipePicker eventId={event.id} options={recipeOptions} attendeeCount={recipeAttendeeCount} locale={locale} />
      ) : event.is_surprise && !revealed ? (
        <SurpriseGate eventId={event.id} canReveal={canManage || isCook} isCook={isCook} locale={locale} />
      ) : recipe ? (
        <Link
          href={`/recepten/${recipe.id}`}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
        >
          {recipeImageUrl && (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-2">
              <Image src={recipeImageUrl} alt={recipe.title} fill className="object-cover" />
            </div>
          )}
          <h2 className="text-title-3 font-heading font-bold">{recipe.title}</h2>
          {recipe.description && <p className="text-body text-muted-foreground">{recipe.description}</p>}
        </Link>
      ) : (
        <p className="text-body text-muted-foreground">{t(locale, "eten.noRecipeChosen")}</p>
      )}

      <CostSplitDisplay totalCostCents={event.total_cost_cents} yesCount={yesCount} locale={locale} />

      <div className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">
          {t(locale, "eten.whoComes")} <span className="text-muted-foreground font-sans font-normal">({yesCount})</span>
        </h2>
        <ul className="flex flex-col gap-1">
          {attendees.length === 0 && pendingMembers.length === 0 ? (
            <p className="text-body text-muted-foreground">{t(locale, "eten.noResponses")}</p>
          ) : (
            <>
              {attendees.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-1">
                  <span className="text-body">{a.expand?.user?.name || a.guest_name || t(locale, "eten.guestFallback")}</span>
                  <RsvpStatusBadge status={a.status as RsvpStatus} locale={locale} />
                </li>
              ))}
              {pendingMembers.map((member) => (
                <li key={member.id} className="flex items-center justify-between py-1">
                  <span className="text-body">{member.name}</span>
                  <RsvpStatusBadge status="pending" locale={locale} />
                </li>
              ))}
            </>
          )}
        </ul>
      </div>

      {(revealed || isCook || isOrganizer) && (
        <ShoppingList eventId={event.id} items={shoppingList} canEdit={!!user} locale={locale} />
      )}

      {canManage && (
        <div className="flex flex-col gap-2">
          <h2 className="text-title-3 font-heading font-bold">{t(locale, "eten.share")}</h2>
          <ShareLinkManager eventId={event.id} shareToken={event.share_token} locale={locale} />
        </div>
      )}
    </div>
  );
}
