"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
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
      setError("Inloggen is niet gelukt. Klopt je e-mail en wachtwoord?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-title-1 font-heading font-extrabold">Welkom terug.</h1>
        <p className="text-body text-muted-foreground mt-1">
          Log in om te zien wat de groep eet.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
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
          <Label htmlFor="password">Wachtwoord</Label>
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
          {loading ? "Bezig..." : "Inloggen"}
        </Button>
      </form>
      <p className="text-center text-body text-muted-foreground">
        Nog geen account?{" "}
        <Link href="/register" className="text-brand-text font-medium">
          Maak er een.
        </Link>
      </p>
    </div>
  );
}
