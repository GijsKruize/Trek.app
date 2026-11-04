import Link from "next/link";
import { Users, Salad, ChevronRight, Plus } from "lucide-react";
import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import { getMyGroups } from "@/lib/api/groups";
import { LogoutButton } from "./LogoutButton";

export default async function ProfielPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const pb = await getServerPocketBase();
  const groups = await getMyGroups(pb, user.id);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1 font-heading font-extrabold">{user.name}</h1>
          <p className="text-body text-muted-foreground">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <Link
        href="/profiel/dieetwensen"
        className="flex min-h-11 items-center justify-between rounded-2xl border border-border bg-card p-4"
      >
        <span className="flex items-center gap-2 text-label font-semibold">
          <Salad className="h-5 w-5" />
          Dieetwensen
        </span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-title-3 font-heading font-bold">Jouw groepen</h2>
          <div className="flex items-center gap-3">
            <Link href="/profiel/groepen/meedoen" className="text-caption font-semibold text-brand-text">
              Code invoeren
            </Link>
            <Link href="/profiel/groepen/nieuw" className="text-caption font-semibold text-brand-text inline-flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              Nieuw
            </Link>
          </div>
        </div>
        {groups.length === 0 ? (
          <p className="text-body text-muted-foreground">
            Nog geen groepen. Maak er een, of vraag een huisgenoot om een uitnodiging.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {groups.map(({ group, role }) => (
              <li key={group.id}>
                <Link
                  href={`/profiel/groepen/${group.id}`}
                  className="flex min-h-11 items-center justify-between rounded-2xl border border-border bg-card p-4"
                >
                  <span className="flex items-center gap-2 text-label font-semibold">
                    <Users className="h-5 w-5" />
                    {group.name}
                  </span>
                  <span className="flex items-center gap-2 text-caption text-muted-foreground">
                    {role === "admin" && "beheerder"}
                    <ChevronRight className="h-5 w-5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
