import "server-only";
import PocketBase, { type RecordModel } from "pocketbase";
import { cookies } from "next/headers";
import { POCKETBASE_URL } from "./client";
import type { TrekUser } from "./types";

export const AUTH_COOKIE_NAME = "trek_pb_auth";

/** Per-request server client, hydrated from the httpOnly session cookie.
 * This (not the browser localStorage store) is the source of truth for
 * route protection and server-side reads — see HANDOVER.md "Auth session
 * plumbing" for why both exist. */
export async function getServerPocketBase(): Promise<PocketBase> {
  const pb = new PocketBase(POCKETBASE_URL);
  // The SDK's auto-cancellation dedupes concurrent requests to the same
  // endpoint path by default (meant for a browser typing/navigating
  // quickly) — it has no purpose on a fresh per-request server client and
  // actively breaks Promise.all() fan-out reads (e.g. per-recipe
  // ingredient fetches in getFeed), aborting all but the last.
  pb.autoCancellation(false);
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (raw) {
    try {
      const { token, model } = JSON.parse(raw) as { token: string; model: unknown };
      pb.authStore.save(token, model as RecordModel);
    } catch {
      // malformed cookie — treat as logged out
    }
  }

  if (pb.authStore.isValid) {
    try {
      await pb.collection("users").authRefresh();
    } catch {
      pb.authStore.clear();
    }
  }

  return pb;
}

export async function getCurrentUser(): Promise<TrekUser | null> {
  const pb = await getServerPocketBase();
  return pb.authStore.isValid ? (pb.authStore.record as unknown as TrekUser) : null;
}
