/// <reference path="../pb_data/types.d.ts" />

// Keeps groups.admins (a denormalized relation, see docs/schema.md) in sync
// with group_members.role, and blocks removing/demoting the last admin.
//
// All logic lives in shared.js and is pulled in via require() inside each
// callback — on this PocketBase build, a hook callback runs in its own
// invocation context and can't see sibling top-level functions declared
// elsewhere in the same file, only require()'d modules, its own
// parameters, and PocketBase's injected globals.

onRecordAfterCreateSuccess((e) => {
  require(`${__hooks}/shared.js`).syncGroupAdmins(e.app, e.record.get("group"));
  e.next();
}, "group_members");

onRecordAfterUpdateSuccess((e) => {
  require(`${__hooks}/shared.js`).syncGroupAdmins(e.app, e.record.get("group"));
  e.next();
}, "group_members");

onRecordAfterDeleteSuccess((e) => {
  require(`${__hooks}/shared.js`).syncGroupAdmins(e.app, e.record.get("group"));
  e.next();
}, "group_members");

onRecordUpdateRequest((e) => {
  const shared = require(`${__hooks}/shared.js`);
  const original = e.app.findRecordById("group_members", e.record.id);
  const wasAdmin = original.get("role") === "admin";
  const willBeAdmin = e.record.get("role") === "admin";
  if (wasAdmin && !willBeAdmin && shared.countGroupAdmins(e.app, original.get("group")) <= 1) {
    throw new ForbiddenError("Een groep moet minstens één beheerder hebben.");
  }
  e.next();
}, "group_members");

onRecordDeleteRequest((e) => {
  const shared = require(`${__hooks}/shared.js`);
  if (e.record.get("role") === "admin" && shared.countGroupAdmins(e.app, e.record.get("group")) <= 1) {
    throw new ForbiddenError("Een groep moet minstens één beheerder hebben.");
  }
  e.next();
}, "group_members");
