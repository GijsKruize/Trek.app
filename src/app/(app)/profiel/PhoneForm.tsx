"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { TrekUser } from "@/lib/pocketbase/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

/** Shown to attendees who try to RSVP after the organizer's deadline has
 * passed, as a WhatsApp link — see RsvpDeadlinePassed. Optional: falls
 * back to email if left empty. Also carries the optional birth date,
 * which is the only way we can confirm a user is 18+ for alcohol-ad
 * gating (business plan §6.1/§10) — grouped here since both are small,
 * rarely-changed profile fields saved the same way. */
export function PhoneForm({ user, locale = DEFAULT_LOCALE }: { user: TrekUser; locale?: Locale }) {
  const { pb } = useAuth();
  const [phone, setPhone] = useState(user.phone ?? "");
  const [birthDate, setBirthDate] = useState(user.birth_date ? user.birth_date.slice(0, 10) : "");
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingBirthDate, setSavingBirthDate] = useState(false);

  async function handleSavePhone() {
    setSavingPhone(true);
    try {
      await pb.collection("users").update(user.id, { phone });
      toast.success(t(locale, "profiel.phoneSaved"));
    } catch {
      toast.error(t(locale, "common.networkError"));
    } finally {
      setSavingPhone(false);
    }
  }

  async function handleSaveBirthDate() {
    setSavingBirthDate(true);
    try {
      await pb.collection("users").update(user.id, { birth_date: birthDate });
      toast.success(t(locale, "profiel.birthDateSaved"));
    } catch {
      toast.error(t(locale, "common.networkError"));
    } finally {
      setSavingBirthDate(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">{t(locale, "profiel.phone")}</Label>
        <p className="text-caption text-muted-foreground">{t(locale, "profiel.phoneHelp")}</p>
        <div className="flex gap-2">
          <Input
            id="phone"
            type="tel"
            placeholder={t(locale, "profiel.phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button onClick={handleSavePhone} disabled={savingPhone}>
            {savingPhone ? "..." : t(locale, "common.save")}
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="birthDate">{t(locale, "profiel.birthDate")}</Label>
        <p className="text-caption text-muted-foreground">{t(locale, "profiel.birthDateHelp")}</p>
        <div className="flex gap-2">
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          <Button onClick={handleSaveBirthDate} disabled={savingBirthDate}>
            {savingBirthDate ? "..." : t(locale, "common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
