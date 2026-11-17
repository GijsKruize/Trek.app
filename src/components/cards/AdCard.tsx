import Image from "next/image";
import { Megaphone } from "lucide-react";
import type { Ad } from "@/lib/pocketbase/types";
import { fileUrl } from "@/lib/pocketbase/client";
import { SponsoredBadge } from "@/components/badges/SponsoredBadge";
import type { Locale } from "@/lib/i18n/translations";

/** Sponsored cards are visually distinct from recipe cards: a Blauwbes
 * border/accent and an explicit "Gesponsord" label — never mistaken for
 * the brand or a group match. */
export function AdCard({ ad, locale }: { ad: Ad; locale: Locale }) {
  const imageUrl = fileUrl(ad, ad.image, "ads");

  return (
    <a
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex w-full flex-col overflow-hidden rounded-2xl border-2 border-info bg-card"
    >
      <div className="relative aspect-[4/3] w-full bg-surface-2">
        {imageUrl ? (
          <Image src={imageUrl} alt={ad.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-info">
            <Megaphone className="h-10 w-10" strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <SponsoredBadge locale={locale} />
        </div>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="text-title-3 font-heading font-bold">{ad.title}</h3>
        {ad.teaser && <p className="text-body text-muted-foreground">{ad.teaser}</p>}
      </div>
    </a>
  );
}
