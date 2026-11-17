import { getLocale } from "@/lib/i18n/server";
import { NewGroupForm } from "./NewGroupForm";

export default async function NewGroupPage() {
  const locale = await getLocale();
  return <NewGroupForm locale={locale} />;
}
