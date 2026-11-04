/// <reference path="../pb_data/types.d.ts" />

// events.updateRule allows the organizer, the assigned cook, or a group
// admin to update an event — but a cook should only be able to touch
// cook-facing fields (reveal, shopping list, etc.), never reassign the
// event itself. PocketBase rules are record-level, not field-level, so
// that distinction is enforced here instead.

onRecordUpdateRequest((e) => {
  const guardedFields = ["organizer", "group", "invitees", "status"];
  const original = e.app.findRecordById("events", e.record.id);
  const authId = e.auth ? e.auth.id : "";

  const isOrganizer = authId !== "" && authId === original.get("organizer");
  let isGroupAdmin = false;
  const groupId = original.get("group");
  if (groupId) {
    const group = e.app.findRecordById("groups", groupId);
    isGroupAdmin = !!group && group.get("admins").indexOf(authId) !== -1;
  }

  if (!isOrganizer && !isGroupAdmin) {
    for (const field of guardedFields) {
      const before = JSON.stringify(original.get(field));
      const after = JSON.stringify(e.record.get(field));
      if (before !== after) {
        throw new ForbiddenError("Alleen de organisator of een groepsbeheerder kan dit veld wijzigen.");
      }
    }
  }

  e.next();
}, "events");
