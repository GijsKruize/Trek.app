import PocketBase from "pocketbase";

export const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "http://127.0.0.1:8090";

let browserClient: PocketBase | null = null;

/** Browser-side singleton. Its authStore lives in localStorage and is the
 * source of truth for client-side calls (including realtime). The
 * server-rendered httpOnly cookie (see server.ts) is a separate, parallel
 * copy used for route protection and SSR data fetching.
 *
 * "use client" components still render once on the server, where
 * `window`/`localStorage` don't exist — the PocketBase SDK already
 * handles that gracefully (falls back to an in-memory, always-logged-out
 * store), so this is safe to call unconditionally during render. The
 * module-level singleton is per-server-process on the server (harmless,
 * since nothing writes to its authStore outside a real browser) and
 * per-browser-tab on the client. */
export function getBrowserPocketBase(): PocketBase {
  if (!browserClient) {
    browserClient = new PocketBase(POCKETBASE_URL);
  }
  return browserClient;
}

export function fileUrl(
  record: { id: string; collectionId?: string; collectionName?: string },
  filename: string | undefined | null,
  collectionName?: string
): string {
  if (!filename) return "";
  const collection = record.collectionName ?? collectionName;
  if (!collection) return "";
  return `${POCKETBASE_URL}/api/files/${collection}/${record.id}/${filename}`;
}
