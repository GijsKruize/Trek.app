"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { LOCALES, t, type Locale } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<Locale, string> = { nl: "NL", en: "EN" };

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setLocale(next: Locale) {
    if (next === locale || pending) return;
    setPending(true);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
      <span className="inline-flex items-center gap-2 text-label">
        <Languages className="h-5 w-5" />
        {t(locale, "profiel.language")}
      </span>
      <div className="flex overflow-hidden rounded-full border border-border">
        {LOCALES.map((option) => (
          <button
            key={option}
            type="button"
            disabled={pending}
            onClick={() => setLocale(option)}
            aria-pressed={locale === option}
            className={cn(
              "min-h-9 min-w-11 px-3 text-caption font-medium transition-colors",
              locale === option ? "bg-primary text-on-primary" : "bg-transparent text-muted-foreground"
            )}
          >
            {LOCALE_LABELS[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
