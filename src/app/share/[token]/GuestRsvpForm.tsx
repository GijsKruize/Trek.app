"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { submitGuestRsvp } from "@/lib/api/share";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export function GuestRsvpForm({ token, locale = DEFAULT_LOCALE }: { token: string; locale?: Locale }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"yes" | "no" | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!status || !name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await submitGuestRsvp(token, name.trim(), status);
      setDone(true);
    } catch {
      setError(t(locale, "rsvp.guestError"));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-success-foreground p-4 text-center text-success">
        <p className="text-label">
          {t(locale, status === "yes" ? "rsvp.guestComing" : "rsvp.guestNotComing", { name })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <Input
        placeholder={t(locale, "rsvp.guestNamePlaceholder")}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStatus("yes")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-label transition-colors ${
            status === "yes" ? "bg-success text-success-foreground" : "bg-surface-2 text-foreground"
          }`}
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
          {t(locale, "rsvp.yes")}
        </button>
        <button
          type="button"
          onClick={() => setStatus("no")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-label transition-colors ${
            status === "no" ? "bg-error text-error-foreground" : "bg-surface-2 text-foreground"
          }`}
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
          {t(locale, "rsvp.no")}
        </button>
      </div>
      {error && <p className="text-caption text-error">{error}</p>}
      <Button type="submit" disabled={!status || !name.trim() || loading} size="lg">
        {loading ? t(locale, "common.busy") : t(locale, "rsvp.guestSubmit")}
      </Button>
    </form>
  );
}
