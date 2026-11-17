"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

export function NewGroupForm({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const { pb } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const group = await pb.collection("groups").create({ name, address });
      toast.success(t(locale, "groups.created"));
      router.push(`/profiel/groepen/${group.id}`);
    } catch {
      toast.error(t(locale, "common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-title-1 font-heading font-extrabold">{t(locale, "groups.newGroupTitle")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">{t(locale, "groups.name")}</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(locale, "groups.namePlaceholder")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">{t(locale, "groups.address")}</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? t(locale, "common.busy") : t(locale, "groups.createGroup")}
        </Button>
      </form>
    </div>
  );
}
