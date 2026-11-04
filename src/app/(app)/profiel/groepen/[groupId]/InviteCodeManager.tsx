"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { GroupInvite } from "@/lib/pocketbase/types";
import { generateInviteCode } from "@/lib/api/groups";
import { Button } from "@/components/ui/button";

export function InviteCodeManager({
  groupId,
  initialInvite,
}: {
  groupId: string;
  initialInvite: GroupInvite | null;
}) {
  const { user, pb } = useAuth();
  const [invite, setInvite] = useState(initialInvite);
  const [loading, setLoading] = useState(false);

  async function createInvite() {
    if (!user) return;
    setLoading(true);
    try {
      if (invite) {
        await pb.collection("group_invites").update(invite.id, { revoked: true });
      }
      const created = await pb.collection("group_invites").create<GroupInvite>({
        group: groupId,
        code: generateInviteCode(),
        created_by: user.id,
        uses_count: 0,
      });
      setInvite(created);
    } catch {
      toast.error("Geen verbinding. Probeer het nog eens.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.code);
    toast.success("Code gekopieerd.");
  }

  if (!invite) {
    return (
      <Button onClick={createInvite} disabled={loading} className="w-full">
        Uitnodigingscode maken
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <p className="text-caption text-muted-foreground">Deel deze code — iedereen met een account kan hem inwisselen.</p>
      <div className="flex items-center justify-between">
        <span className="text-title-2 font-heading font-extrabold tracking-wide">{invite.code}</span>
        <Button variant="outline" size="icon" onClick={copyCode} aria-label="Kopiëren">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={createInvite} disabled={loading} className="self-start">
        <RefreshCw className="h-4 w-4" />
        Nieuwe code
      </Button>
    </div>
  );
}
