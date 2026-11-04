"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Link2Off, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { enableShareLink, revokeShareLink } from "@/lib/api/events";
import { Button } from "@/components/ui/button";

export function ShareLinkManager({ eventId, shareToken }: { eventId: string; shareToken: string }) {
  const { pb } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const shareUrl = shareToken && typeof window !== "undefined" ? `${window.location.origin}/share/${shareToken}` : "";

  async function handleEnable() {
    setLoading(true);
    try {
      await enableShareLink(pb, eventId);
      router.refresh();
    } catch {
      toast.error("Geen verbinding. Probeer het nog eens.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    setLoading(true);
    try {
      await revokeShareLink(pb, eventId);
      router.refresh();
    } catch {
      toast.error("Geen verbinding. Probeer het nog eens.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link gekopieerd.");
  }

  if (!shareToken) {
    return (
      <Button variant="outline" onClick={handleEnable} disabled={loading} className="w-full">
        <Link2 className="h-4 w-4" />
        Deel-link aanmaken
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <p className="text-caption text-muted-foreground">
        Iedereen met deze link kan reageren zonder account.
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 rounded-lg bg-surface-2 px-3 py-2 text-caption text-muted-foreground"
        />
        <Button variant="outline" size="icon" onClick={copyLink} aria-label="Kopiëren">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={handleRevoke} disabled={loading} className="self-start text-error">
        <Link2Off className="h-4 w-4" />
        Link intrekken
      </Button>
    </div>
  );
}
