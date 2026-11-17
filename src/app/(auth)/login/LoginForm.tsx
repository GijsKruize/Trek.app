"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, type Locale } from "@/lib/i18n/translations";

export function LoginForm({ locale }: { locale: Locale }) {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push(searchParams.get("next") ?? "/feed");
      router.refresh();
    } catch {
      setError(t(locale, "auth.loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-title-1 font-heading font-extrabold">{t(locale, "auth.welcomeBack")}</h1>
        <p className="text-body text-muted-foreground mt-1">{t(locale, "auth.loginSubtitle")}</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t(locale, "auth.email")}</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t(locale, "auth.password")}</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-caption text-error bg-error-foreground rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={loading} className="mt-2">
          {loading ? t(locale, "common.busy") : t(locale, "auth.loginButton")}
        </Button>
      </form>
      <p className="text-center text-body text-muted-foreground">
        {t(locale, "auth.noAccount")}{" "}
        <Link href="/register" className="text-brand-text font-medium">
          {t(locale, "auth.createOne")}
        </Link>
      </p>
    </div>
  );
}
