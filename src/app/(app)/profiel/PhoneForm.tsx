"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { TrekUser } from "@/lib/pocketbase/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

/** Shown to attendees who try to RSVP after the organizer's deadline has
 * passed, as a WhatsApp link — see RsvpDeadlinePassed. Optional: falls
 * back to email if left empty. */
export function PhoneForm({ user }: { user: TrekUser }) {
  const { pb } = useAuth();
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await pb.collection("users").update(user.id, { phone });
      toast.success("Telefoonnummer opgeslagen.");
    } catch {
      toast.error("Geen verbinding. Probeer het nog eens.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <Label htmlFor="phone">Telefoonnummer</Label>
      <p className="text-caption text-muted-foreground">
        Zodat huisgenoten je kunnen appen als RSVP&apos;s voor een etentje gesloten zijn.
      </p>
      <div className="flex gap-2">
        <Input
          id="phone"
          type="tel"
          placeholder="06 12345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "..." : "Opslaan"}
        </Button>
      </div>
    </div>
  );
}
