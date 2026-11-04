import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/pocketbase/server";

/** Mirrors the browser authStore into an httpOnly cookie right after a
 * client-side login, so middleware and Server Components can verify the
 * session. See HANDOVER.md "Auth session plumbing". */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = body?.token;
  const model = body?.model;

  if (!token || !model) {
    return NextResponse.json({ error: "token and model zijn verplicht." }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify({ token, model }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
