"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export function LogoutButton({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout} aria-label={t(locale, "profiel.logoutAria")}>
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
