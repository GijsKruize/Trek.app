"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createEventSeries } from "@/lib/api/events";
import { getGroupMembers } from "@/lib/api/groups";
import type { Group, TrekUser, Weekday } from "@/lib/pocketbase/types";
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
import { t, DEFAULT_LOCALE, type Locale, type TranslationKey } from "@/lib/i18n/translations";

const WEEKDAY_KEYS: Record<Weekday, TranslationKey> = {
  mon: "seriesForm.weekdayMon",
  tue: "seriesForm.weekdayTue",
  wed: "seriesForm.weekdayWed",
  thu: "seriesForm.weekdayThu",
  fri: "seriesForm.weekdayFri",
  sat: "seriesForm.weekdaySat",
  sun: "seriesForm.weekdaySun",
};

const WEEKDAYS = Object.keys(WEEKDAY_KEYS) as Weekday[];

export function NewSeriesForm({ groups, locale = DEFAULT_LOCALE }: { groups: Group[]; locale?: Locale }) {
  const { user, pb } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [groupId, setGroupId] = useState<string>("");
  const [location, setLocation] = useState("");
  const [freq, setFreq] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [weekday, setWeekday] = useState<Weekday>("wed");
  const [startTime, setStartTime] = useState("18:30");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSurprise, setIsSurprise] = useState(false);
  const [cookRotationEnabled, setCookRotationEnabled] = useState(false);
  const [members, setMembers] = useState<TrekUser[]>([]);
  const [rotationOrder, setRotationOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMembers() {
      const users = groupId
        ? (await getGroupMembers(pb, groupId)).map((m) => m.expand?.user).filter((u): u is TrekUser => !!u)
        : [];
      if (cancelled) return;
      setMembers(users);
      setRotationOrder(users.map((u) => u.id));
    }
    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [groupId, pb]);

  function toggleRotationMember(userId: string) {
    setRotationOrder((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !startDate) return;
    setLoading(true);
    try {
      await createEventSeries(pb, {
        organizer: user.id,
        title,
        groupId: groupId || undefined,
        rruleFreq: freq,
        rruleByweekday: weekday,
        startTime,
        startDate,
        endDate: endDate || undefined,
        cookRotationEnabled: cookRotationEnabled && rotationOrder.length > 0,
        cookRotationOrder: cookRotationEnabled ? rotationOrder : [],
        surpriseDefault: isSurprise,
        defaultLocation: location || undefined,
      });
      toast.success(t(locale, "seriesForm.created"));
      router.push("/eten");
      router.refresh();
    } catch {
      toast.error(t(locale, "common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{t(locale, "seriesForm.titleLabel")}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t(locale, "seriesForm.titlePlaceholder")}
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
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <Label>{t(locale, "seriesForm.frequency")}</Label>
          <Select value={freq} onValueChange={(v) => setFreq(v as typeof freq)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">{t(locale, "seriesForm.weekly")}</SelectItem>
              <SelectItem value="biweekly">{t(locale, "seriesForm.biweekly")}</SelectItem>
              <SelectItem value="monthly">{t(locale, "seriesForm.monthly")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t(locale, "seriesForm.day")}</Label>
          <Select value={weekday} onValueChange={(v) => setWeekday(v as Weekday)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((day) => (
                <SelectItem key={day} value={day}>
                  {t(locale, WEEKDAY_KEYS[day])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startTime">{t(locale, "seriesForm.time")}</Label>
          <Input id="startTime" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">{t(locale, "seriesForm.firstTime")}</Label>
          <Input id="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="endDate">{t(locale, "seriesForm.endDate")}</Label>
        <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="location">{t(locale, "eventForm.location")}</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <div>
          <p className="text-label">{t(locale, "eventForm.surprise")}</p>
          <p className="text-caption text-muted-foreground">{t(locale, "seriesForm.surpriseHelp")}</p>
        </div>
        <Switch checked={isSurprise} onCheckedChange={setIsSurprise} />
      </div>
      {groupId && members.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label">{t(locale, "seriesForm.cookRotation")}</p>
              <p className="text-caption text-muted-foreground">{t(locale, "seriesForm.cookRotationHelp")}</p>
            </div>
            <Switch checked={cookRotationEnabled} onCheckedChange={setCookRotationEnabled} />
          </div>
          {cookRotationEnabled && (
            <ul className="flex flex-col gap-1 pt-1">
              {members.map((member) => {
                const position = rotationOrder.indexOf(member.id);
                return (
                  <li key={member.id}>
                    <label className="flex min-h-11 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={position !== -1}
                        onChange={() => toggleRotationMember(member.id)}
                        className="h-5 w-5 accent-primary"
                      />
                      <span className="flex-1 text-body">{member.name}</span>
                      {position !== -1 && (
                        <span className="text-caption text-muted-foreground">#{position + 1}</span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      <Button type="submit" size="lg" disabled={loading} className="mt-2">
        {loading ? t(locale, "common.busy") : t(locale, "seriesForm.submit")}
      </Button>
    </form>
  );
}
