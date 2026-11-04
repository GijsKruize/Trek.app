"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewGroupPage() {
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
      toast.success("Groep aangemaakt.");
      router.push(`/profiel/groepen/${group.id}`);
    } catch {
      toast.error("Geen verbinding. Probeer het nog eens.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-title-1 font-heading font-extrabold">Nieuwe groep</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Naam</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Huize Vrolik" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Adres (standaard locatie voor etentjes)</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Bezig..." : "Groep aanmaken"}
        </Button>
      </form>
    </div>
  );
}
