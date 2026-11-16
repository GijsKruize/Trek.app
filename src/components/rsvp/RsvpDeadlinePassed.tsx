import { Lock, MessageCircle, Mail } from "lucide-react";

export interface OrganizerContact {
  name: string;
  phone?: string;
  email?: string;
}

/** Shown instead of RsvpButtons once the organizer's cutoff has passed —
 * rather than silently accepting (or silently rejecting) a late RSVP, it
 * tells the visitor the list is final and points them at the organizer
 * directly (WhatsApp if a phone number is on file, email otherwise). */
export function RsvpDeadlinePassed({ organizer }: { organizer: OrganizerContact | undefined }) {
  const whatsappHref = organizer?.phone
    ? `https://wa.me/${organizer.phone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-2 p-4">
      <p className="inline-flex items-center gap-2 text-label font-semibold">
        <Lock className="h-4 w-4" strokeWidth={2.5} />
        RSVP&apos;s zijn gesloten
      </p>
      <p className="text-body text-muted-foreground">
        De aanmeldingen zijn vastgezet. Wil je nog mee (of toch niet)? Neem rechtstreeks contact op
        met {organizer?.name ?? "de organisator"}.
      </p>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-success text-success-foreground px-4 text-label font-semibold"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2.5} />
          App {organizer?.name}
        </a>
      ) : organizer?.email ? (
        <a
          href={`mailto:${organizer.email}`}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-surface-2 border border-border px-4 text-label font-semibold"
        >
          <Mail className="h-4 w-4" strokeWidth={2.5} />
          Mail {organizer?.name}
        </a>
      ) : null}
    </div>
  );
}
