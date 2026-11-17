"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createEvent } from "@/lib/api/events";
import type { Group } from "@/lib/pocketbase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/translations";

type DeadlineMode = "none" | "day_before" | "day_of";

/** Combine the event's own date with the deadline mode + time into the
 * ISO datetime PocketBase expects, or undefined when no deadline is set. */
function computeRsvpDeadline(startsAt: string, mode: DeadlineMode, time: string): string | undefined {
  if (mode === "none" || !startsAt || !time) return undefined;
  const start = new Date(startsAt);
  const [hours, minutes] = time.split(":").map(Number);
  const deadline = new Date(start);
  if (mode === "day_before") deadline.setDate(deadline.getDate() - 1);
  deadline.setHours(hours, minutes, 0, 0);
  return deadline.toISOString();
}

export function NewEventForm({ groups, locale = DEFAULT_LOCALE }: { groups: Group[]; locale?: Locale }) {
  const { user, pb } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [groupId, setGroupId] = useState<string>("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [isSurprise, setIsSurprise] = useState(false);
  const [deadlineMode, setDeadlineMode] = useState<DeadlineMode>("day_of");
  const [deadlineTime, setDeadlineTime] = useState("17:00");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const event = await createEvent(pb, {
        organizer: user.id,
        title,
        startsAt: new Date(startsAt).toISOString(),
        location,
        isSurprise,
        groupId: groupId || undefined,
        rsvpDeadline: computeRsvpDeadline(startsAt, deadlineMode, deadlineTime),
      });
      toast.success(t(locale, "eventForm.created"));
      router.push(`/eten/${event.id}`);
    } catch {
      toast.error(t(locale, "common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t(locale, "eventForm.titleLabel")}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t(locale, "eventForm.titlePlaceholder")}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>{t(locale, "eventForm.group")}</Label>
        <Select value={groupId || "loose"} onValueChange={(v) => setGroupId(v === "loose" ? "" : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t(locale, "eventForm.looseEvent")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="loose">{t(locale, "eventForm.looseEvent")}</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-caption text-muted-foreground">
          {groupId ? t(locale, "eventForm.looseHelpGroup") : t(locale, "eventForm.looseHelpNoGroup")}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="startsAt">{t(locale, "eventForm.dateTime")}</Label>
        <Input
          id="startsAt"
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="location">{t(locale, "eventForm.location")}</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>{t(locale, "eventForm.rsvpClose")}</Label>
        <div className="flex gap-2">
          <Select value={deadlineMode} onValueChange={(v) => setDeadlineMode(v as DeadlineMode)}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day_of">{t(locale, "eventForm.dayOf")}</SelectItem>
              <SelectItem value="day_before">{t(locale, "eventForm.dayBefore")}</SelectItem>
              <SelectItem value="none">{t(locale, "eventForm.never")}</SelectItem>
            </SelectContent>
          </Select>
          {deadlineMode !== "none" && (
            <Input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="w-28"
            />
          )}
        </div>
        <p className="text-caption text-muted-foreground">{t(locale, "eventForm.rsvpHelp")}</p>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <div>
          <p className="text-label">{t(locale, "eventForm.surprise")}</p>
          <p className="text-caption text-muted-foreground">{t(locale, "eventForm.surpriseHelp")}</p>
        </div>
        <Switch checked={isSurprise} onCheckedChange={setIsSurprise} />
      </div>
      <p className="text-caption text-muted-foreground">{t(locale, "eventForm.recipeHint")}</p>
      <Button type="submit" size="lg" disabled={loading} className="mt-2">
        {loading ? t(locale, "common.busy") : t(locale, "eventForm.submit")}
      </Button>
    </form>
  );
}
