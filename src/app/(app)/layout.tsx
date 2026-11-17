import { BottomNav } from "@/components/nav/BottomNav";
import { getLocale } from "@/lib/i18n/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <main className="mx-auto w-full max-w-xl flex-1 pb-24">{children}</main>
      <BottomNav locale={locale} />
    </div>
  );
}
