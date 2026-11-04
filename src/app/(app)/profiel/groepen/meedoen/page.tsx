"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { redeemInvite } from "@/lib/api/invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function JoinGroupPage() {
  const { pb } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await redeemInvite(pb, code.trim());
      toast.success(`Welkom bij ${result.groupName}.`);
      router.push(`/profiel/groepen/${result.groupId}`);
    } catch {
      toast.error("Ongeldige of verlopen code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-title-1 font-heading font-extrabold">Lid worden?</h1>
      <p className="text-body text-muted-foreground">Vraag een huisgenoot om de uitnodigingscode.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="text-center text-title-2 font-heading font-extrabold tracking-wide"
          />
        </div>
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Bezig..." : "Doe mee."}
        </Button>
      </form>
    </div>
  );
}
