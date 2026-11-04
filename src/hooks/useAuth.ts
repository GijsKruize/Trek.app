"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserPocketBase } from "@/lib/pocketbase/client";
import type { TrekUser } from "@/lib/pocketbase/types";

export function useAuth() {
  const pb = getBrowserPocketBase();
  const [user, setUser] = useState<TrekUser | null>(
    pb.authStore.isValid ? (pb.authStore.record as unknown as TrekUser) : null
  );

  useEffect(() => {
    return pb.authStore.onChange(() => {
      setUser(pb.authStore.isValid ? (pb.authStore.record as unknown as TrekUser) : null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncSessionCookie = useCallback(async () => {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: pb.authStore.token, model: pb.authStore.record }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const authData = await pb.collection("users").authWithPassword(email, password);
      await syncSessionCookie();
      return authData;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [syncSessionCookie]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      await pb.collection("users").create({ email, password, passwordConfirm: password, name });
      return login(email, password);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [login]
  );

  const logout = useCallback(async () => {
    pb.authStore.clear();
    await fetch("/api/auth/session", { method: "DELETE" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, login, register, logout, pb };
}
