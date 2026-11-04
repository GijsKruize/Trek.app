import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import { getActiveInvite, getGroupMembers } from "@/lib/api/groups";
import type { Group } from "@/lib/pocketbase/types";
import { InviteCodeManager } from "./InviteCodeManager";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const pb = await getServerPocketBase();

  let group: Group;
  try {
    group = await pb.collection("groups").getOne<Group>(groupId);
  } catch {
    notFound();
  }

  const members = await getGroupMembers(pb, groupId);
  const isAdmin = group.admins.includes(user.id);
  const activeInvite = isAdmin ? await getActiveInvite(pb, groupId) : null;

  return (
    <div className="flex flex-col gap-5 p-4">
      <div>
        <h1 className="text-title-1 font-heading font-extrabold">{group.name}</h1>
        {group.address && (
          <p className="mt-1 flex items-center gap-1 text-body text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {group.address}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-title-3 font-heading font-bold">
          Leden <span className="text-muted-foreground font-sans font-normal">({members.length})</span>
        </h2>
        <ul className="flex flex-col gap-1">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-body">{m.expand?.user?.name ?? "Onbekend"}</span>
              {m.role === "admin" && (
                <span className="rounded-full bg-surface-2 px-2.5 py-1 text-caption font-medium text-muted-foreground">
                  beheerder
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isAdmin && (
        <div className="flex flex-col gap-2">
          <h2 className="text-title-3 font-heading font-bold">Uitnodigen</h2>
          <InviteCodeManager groupId={groupId} initialInvite={activeInvite} />
        </div>
      )}
    </div>
  );
}
