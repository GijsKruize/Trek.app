"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createLooseEvent } from "@/lib/api/events";
import type { Recipe } from "@/lib/pocketbase/types";
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

export function NewEventForm({ recipes }: { recipes: Recipe[] }) {
  const { user, pb } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [recipeId, setRecipeId] = useState<string>("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [isSurprise, setIsSurprise] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const event = await createLooseEvent(pb, {
        organizer: user.id,
        title,
        startsAt: new Date(startsAt).toISOString(),
        location,
        isSurprise,
        recipeId: recipeId || undefined,
      });
      toast.success("Etentje aangemaakt.");
      router.push(`/eten/${event.id}`);
    } catch {
      toast.error("Geen verbinding. Probeer het nog eens.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Titel (optioneel)</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Etentje" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Recept</Label>
        <Select value={recipeId} onValueChange={setRecipeId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Kies een recept (optioneel)" />
          </SelectTrigger>
          <SelectContent>
            {recipes.map((recipe) => (
              <SelectItem key={recipe.id} value={recipe.id}>
                {recipe.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="startsAt">Datum &amp; tijd</Label>
        <Input
          id="startsAt"
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="location">Locatie</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <div>
          <p className="text-label font-semibold">Verrassing?</p>
          <p className="text-caption text-muted-foreground">
            Alleen jij en de kok zien het recept tot je het onthult.
          </p>
        </div>
        <Switch checked={isSurprise} onCheckedChange={setIsSurprise} />
      </div>
      <Button type="submit" size="lg" disabled={loading} className="mt-2">
        {loading ? "Bezig..." : "Etentje aanmaken"}
      </Button>
    </form>
  );
}
