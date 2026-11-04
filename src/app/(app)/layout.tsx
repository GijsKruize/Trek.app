import { BottomNav } from "@/components/nav/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <main className="mx-auto w-full max-w-xl flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
