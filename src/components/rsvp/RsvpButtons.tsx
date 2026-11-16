"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { setRsvp, type RsvpStatus } from "@/lib/api/events";
import { toast } from "sonner";

export function RsvpButtons({
  eventId,
  initialStatus,
  onChange,
}: {
  eventId: string;
  initialStatus: RsvpStatus;
  onChange?: (status: RsvpStatus) => void;
}) {
  const { user, pb } = useAuth();
  const [status, setStatus] = useState<RsvpStatus>(initialStatus);
  const [pending, setPending] = useState(false);

  async function respond(next: "yes" | "no") {
    if (!user || pending) return;
    setPending(true);
    const previous = status;
    setStatus(next);
    onChange?.(next);
    try {
      await setRsvp(pb, eventId, user.id, next);
    } catch {
      setStatus(previous);
      onChange?.(previous);
      toast.error("Geen verbinding. Probeer het nog eens.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="flex gap-2"
      // Key action, lower half of the screen where this is rendered on
      // the event detail page — see mobile-first rules in HANDOVER.md.
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          respond("yes");
        }}
        disabled={pending}
        className={cn(
          "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-label transition-colors",
          status === "yes"
            ? "bg-success text-success-foreground"
            : "bg-surface-2 text-foreground hover:bg-border"
        )}
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
        Ik kom
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          respond("no");
        }}
        disabled={pending}
        className={cn(
          "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-label transition-colors",
          status === "no"
            ? "bg-error text-error-foreground"
            : "bg-surface-2 text-foreground hover:bg-border"
        )}
      >
        <X className="h-4 w-4" strokeWidth={2.5} />
        Ik kom niet
      </button>
    </div>
  );
}
