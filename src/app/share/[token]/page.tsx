import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, EyeOff, Users } from "lucide-react";
import { TrekWordmark } from "@/components/brand/TrekWordmark";
import { fetchSharedEvent, sharedRecipeImageUrl } from "@/lib/api/share";
import { RsvpDeadlinePassed } from "@/components/rsvp/RsvpDeadlinePassed";
import { GuestRsvpForm } from "./GuestRsvpForm";

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function SharedEventPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = await fetchSharedEvent(token);
  if (!payload) notFound();

  const imageUrl = payload.recipe ? sharedRecipeImageUrl(payload.recipe.recipeId, payload.recipe.image) : "";

  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-background px-4 py-10">
      <TrekWordmark width={140} className="mb-8" />
      <div className="flex w-full max-w-sm flex-col gap-5">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wide text-brand-text">
            {dateFormatter.format(new Date(payload.startsAt))}
          </p>
          <h1 className="text-title-1 font-heading font-extrabold">{payload.title}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-caption text-muted-foreground">
            {payload.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {payload.location}
              </span>
            )}
            {payload.organizerName && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {payload.organizerName}
              </span>
            )}
          </div>
        </div>

        {payload.isSurprise && !payload.revealed ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-2 p-6 text-center">
            <EyeOff className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-body text-muted-foreground">
              Verrassing. Het recept wordt onthuld zodra de organisator dat doet.
            </p>
          </div>
        ) : payload.recipe ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            {imageUrl && (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-2">
                <Image src={imageUrl} alt={payload.recipe.title} fill className="object-cover" />
              </div>
            )}
            <h2 className="text-title-3 font-heading font-bold">{payload.recipe.title}</h2>
            {payload.recipe.description && (
              <p className="text-body text-muted-foreground">{payload.recipe.description}</p>
            )}
          </div>
        ) : null}

        <p className="text-body text-muted-foreground">
          {payload.rsvpSummary.yes} {payload.rsvpSummary.yes === 1 ? "persoon komt" : "mensen komen"}.
        </p>

        {payload.rsvpLocked ? (
          <RsvpDeadlinePassed
            organizer={{ name: payload.organizerName, phone: payload.organizerPhone, email: payload.organizerEmail }}
          />
        ) : (
          <GuestRsvpForm token={token} />
        )}
      </div>
    </div>
  );
}
