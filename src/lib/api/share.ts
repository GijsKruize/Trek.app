import { POCKETBASE_URL } from "@/lib/pocketbase/client";

export interface SharedRecipe {
  recipeId: string;
  title: string;
  description: string;
  image: string;
}

export interface SharePayload {
  title: string;
  startsAt: string;
  location: string;
  organizerName: string;
  organizerPhone: string;
  organizerEmail: string;
  cookName: string;
  isSurprise: boolean;
  revealed: boolean;
  recipe: SharedRecipe | null;
  rsvpSummary: { yes: number; no: number };
  rsvpLocked: boolean;
}

export async function fetchSharedEvent(token: string): Promise<SharePayload | null> {
  const res = await fetch(`${POCKETBASE_URL}/api/trek/share/${token}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function submitGuestRsvp(token: string, name: string, status: "yes" | "no"): Promise<void> {
  const res = await fetch(`${POCKETBASE_URL}/api/trek/share/${token}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Kon RSVP niet versturen.");
  }
}

export function sharedRecipeImageUrl(recipeId: string, filename: string): string {
  if (!filename) return "";
  return `${POCKETBASE_URL}/api/files/recipes/${recipeId}/${filename}`;
}
