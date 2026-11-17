"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Soup, CalendarDays, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { t, type Locale, type TranslationKey } from "@/lib/i18n/translations";

const TABS: { href: string; labelKey: TranslationKey; icon: typeof Soup }[] = [
  { href: "/feed", labelKey: "nav.feed", icon: Soup },
  { href: "/eten", labelKey: "nav.eten", icon: CalendarDays },
  { href: "/profiel", labelKey: "nav.profiel", icon: CircleUser },
];

export function BottomNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label={t(locale, "nav.aria")}
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {TABS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[56px] min-w-[72px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-caption font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
              {t(locale, labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
