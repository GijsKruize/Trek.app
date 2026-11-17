import { getLocale } from "@/lib/i18n/server";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const locale = await getLocale();
  return <RegisterForm locale={locale} />;
}
