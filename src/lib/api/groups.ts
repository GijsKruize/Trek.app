import type PocketBase from "pocketbase";
import type { Group, GroupInvite, GroupMember, TrekUser } from "@/lib/pocketbase/types";

interface GroupMemberExpanded extends GroupMember {
  expand?: { group?: Group; user?: TrekUser };
}

export interface MyGroup {
  group: Group;
  role: "admin" | "member";
}

export async function getMyGroups(pb: PocketBase, userId: string): Promise<MyGroup[]> {
  const memberships = await pb.collection("group_members").getFullList<GroupMemberExpanded>({
    filter: `user = "${userId}"`,
    expand: "group",
  });
  return memberships
    .filter((m) => m.expand?.group)
    .map((m) => ({ group: m.expand!.group as Group, role: m.role }));
}

export async function getGroupMembers(pb: PocketBase, groupId: string) {
  return pb.collection("group_members").getFullList<GroupMemberExpanded>({
    filter: `group = "${groupId}"`,
    expand: "user",
    sort: "-role",
  });
}

export async function getActiveInvite(pb: PocketBase, groupId: string): Promise<GroupInvite | null> {
  try {
    return await pb
      .collection("group_invites")
      .getFirstListItem<GroupInvite>(`group = "${groupId}" && revoked = false`, { sort: "-created" });
  } catch {
    return null;
  }
}

export function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
