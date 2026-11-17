import { Suspense } from "react";
import { getLocale } from "@/lib/i18n/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const locale = await getLocale();
  return (
    <Suspense>
      <LoginForm locale={locale} />
    </Suspense>
  );
}
