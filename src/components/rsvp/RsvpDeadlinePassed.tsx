import { Lock, MessageCircle, Mail } from "lucide-react";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export interface OrganizerContact {
  name: string;
  phone?: string;
  email?: string;
}

/** Shown instead of RsvpButtons once the organizer's cutoff has passed —
 * rather than silently accepting (or silently rejecting) a late RSVP, it
 * tells the visitor the list is final and points them at the organizer
 * directly (WhatsApp if a phone number is on file, email otherwise). */
export function RsvpDeadlinePassed({
  organizer,
  locale = DEFAULT_LOCALE,
}: {
  organizer: OrganizerContact | undefined;
  locale?: Locale;
}) {
  const whatsappHref = organizer?.phone
    ? `https://wa.me/${organizer.phone.replace(/[^0-9]/g, "")}`
    : null;
  const organizerName = organizer?.name ?? t(locale, "rsvp.closedDefaultOrganizer");

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-2 p-4">
      <p className="inline-flex items-center gap-2 text-label">
        <Lock className="h-4 w-4" strokeWidth={2.5} />
        {t(locale, "rsvp.closed")}
      </p>
      <p className="text-body text-muted-foreground">{t(locale, "rsvp.closedBody", { name: organizerName })}</p>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-success text-success-foreground px-4 text-label"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2.5} />
          {t(locale, "rsvp.whatsapp", { name: organizerName })}
        </a>
      ) : organizer?.email ? (
        <a
          href={`mailto:${organizer.email}`}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-surface-2 border border-border px-4 text-label"
        >
          <Mail className="h-4 w-4" strokeWidth={2.5} />
          {t(locale, "rsvp.mail", { name: organizerName })}
        </a>
      ) : null}
    </div>
  );
}
