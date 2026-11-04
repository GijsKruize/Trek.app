import type PocketBase from "pocketbase";
import { POCKETBASE_URL } from "@/lib/pocketbase/client";

export interface RedeemResult {
  groupId: string;
  groupName: string;
  alreadyMember: boolean;
}

/** Invite redemption can't go through the generic group_members create
 * (see docs/schema.md) — it's a dedicated authenticated route. */
export async function redeemInvite(pb: PocketBase, code: string): Promise<RedeemResult> {
  const res = await fetch(`${POCKETBASE_URL}/api/trek/invites/redeem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Kon uitnodiging niet verwerken.");
  }
  return res.json();
}
