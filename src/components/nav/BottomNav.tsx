"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Soup, CalendarDays, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/feed", label: "Feed", icon: Soup },
  { href: "/eten", label: "Eten", icon: CalendarDays },
  { href: "/profiel", label: "Profiel", icon: CircleUser },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Hoofdnavigatie"
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
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
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
