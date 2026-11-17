"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, type Locale } from "@/lib/i18n/translations";

export function RegisterForm({ locale }: { locale: Locale }) {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, name);
      router.push("/feed");
      router.refresh();
    } catch {
      setError(t(locale, "auth.registerError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-title-1 font-heading font-extrabold">Trek?</h1>
        <p className="text-body text-muted-foreground mt-1">{t(locale, "auth.registerSubtitle")}</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">{t(locale, "auth.name")}</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
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
            minLength={8}
            autoComplete="new-password"
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
          {loading ? t(locale, "common.busy") : t(locale, "auth.registerButton")}
        </Button>
      </form>
      <p className="text-center text-body text-muted-foreground">
        {t(locale, "auth.haveAccount")}{" "}
        <Link href="/login" className="text-brand-text font-medium">
          {t(locale, "auth.login")}
        </Link>
      </p>
      <p className="text-center text-caption text-muted-foreground">
        {t(locale, "auth.consentPrefix")}{" "}
        <Link href="/privacy" className="text-brand-text">
          {t(locale, "auth.privacyLink")}
        </Link>
        .
      </p>
    </div>
  );
}
