import { getServerPocketBase, getCurrentUser } from "@/lib/pocketbase/server";
import { getMyGroups } from "@/lib/api/groups";
import { NewEventForm } from "./NewEventForm";

export default async function NewEventPage() {
  const pb = await getServerPocketBase();
  const user = await getCurrentUser();
  const myGroups = user ? await getMyGroups(pb, user.id) : [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-title-1 font-heading font-extrabold">Nieuw etentje</h1>
      <NewEventForm groups={myGroups.map((g) => g.group)} />
    </div>
  );
}
