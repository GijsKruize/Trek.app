import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./translations";

export const LOCALE_COOKIE_NAME = "trek_locale";

/** Server Components read the viewer's language preference from a plain
 * (non-httpOnly — the client needs it too, see LocaleSwitcher) cookie.
 * No account field: language is a per-device UI preference, not data
 * worth syncing across devices. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return (LOCALES as string[]).includes(raw ?? "") ? (raw as Locale) : DEFAULT_LOCALE;
}
