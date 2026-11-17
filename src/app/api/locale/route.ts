import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALES } from "@/lib/i18n/translations";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const locale = body?.locale;

  if (!LOCALES.includes(locale)) {
    return NextResponse.json({ error: "Unknown locale." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}
