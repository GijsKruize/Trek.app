"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Uitloggen">
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
