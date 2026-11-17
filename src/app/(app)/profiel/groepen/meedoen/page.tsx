import { getLocale } from "@/lib/i18n/server";
import { JoinGroupForm } from "./JoinGroupForm";

export default async function JoinGroupPage() {
  const locale = await getLocale();
  return <JoinGroupForm locale={locale} />;
}
