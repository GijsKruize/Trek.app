/// <reference path="../pb_data/types.d.ts" />

// Creating a group has the same chicken-and-egg problem as invite
// redemption: group_members.createRule requires group.admins to already
// contain the requester, which is impossible for a brand-new group with
// no members yet. So the founding admin membership is created here, with
// elevated privileges, right after the group itself is persisted.

onRecordCreateRequest((e) => {
  const authId = e.auth ? e.auth.id : "";
  e.next();

  if (authId) {
    const membersCollection = e.app.findCollectionByNameOrId("group_members");
    const member = new Record(membersCollection);
    member.set("group", e.record.id);
    member.set("user", authId);
    member.set("role", "admin");
    e.app.save(member);
  }
}, "groups");
