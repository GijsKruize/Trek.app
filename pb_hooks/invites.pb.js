/// <reference path="../pb_data/types.d.ts" />

// Invite redemption can't go through the generic group_members REST create
// (a not-yet-member can't satisfy group.admins to add themselves), so it's
// a dedicated route that validates the code and inserts the membership with
// elevated privileges.

routerAdd(
  "POST",
  "/api/trek/invites/redeem",
  (e) => {
    const shared = require(`${__hooks}/shared.js`);
    const data = new DynamicModel({ code: "" });
    e.bindBody(data);
    const code = (data.code || "").trim();
    if (!code) {
      throw new BadRequestError("code is verplicht.");
    }

    const invite = shared.tryFindFirst(e.app, "group_invites", "code = {:code} && revoked = false", { code: code });
    if (!invite) {
      throw new NotFoundError("Ongeldige of verlopen uitnodigingscode.");
    }

    // expires_at comes back from .get() as a wrapper object that's always
    // JS-truthy even when unset — only a successfully-parsed date counts.
    const expiresAtParsed = new Date(String(invite.get("expires_at")).trim().replace(" ", "T"));
    if (!isNaN(expiresAtParsed.getTime()) && expiresAtParsed.getTime() < Date.now()) {
      throw new BadRequestError("Deze uitnodiging is verlopen.");
    }
    const maxUses = invite.get("max_uses");
    if (maxUses && invite.get("uses_count") >= maxUses) {
      throw new BadRequestError("Deze uitnodiging is al te vaak gebruikt.");
    }

    const groupId = invite.get("group");
    const userId = e.auth.id;

    const existingMembership = shared.tryFindFirst(e.app, "group_members", "group = {:group} && user = {:user}", {
      group: groupId,
      user: userId,
    });

    e.app.runInTransaction((txApp) => {
      if (!existingMembership) {
        const membersCollection = txApp.findCollectionByNameOrId("group_members");
        const member = new Record(membersCollection);
        member.set("group", groupId);
        member.set("user", userId);
        member.set("role", "member");
        txApp.save(member);
      }

      const freshInvite = txApp.findRecordById("group_invites", invite.id);
      freshInvite.set("uses_count", (freshInvite.get("uses_count") || 0) + 1);
      txApp.save(freshInvite);
    });

    const group = e.app.findRecordById("groups", groupId);
    return e.json(200, {
      groupId: group.id,
      groupName: group.get("name"),
      alreadyMember: !!existingMembership,
    });
  },
  $apis.requireAuth()
);
