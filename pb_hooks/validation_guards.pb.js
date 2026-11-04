/// <reference path="../pb_data/types.d.ts" />

// Small cross-field invariants the filter-expression rules can't express,
// plus the cook-reassignment side effect when an assigned cook RSVPs "no".
// All reusable logic lives in shared.js, required fresh inside each
// callback (see the note in group_admin_sync.pb.js for why).

onRecordCreateRequest((e) => {
  require(`${__hooks}/shared.js`).requireGuestNameOrUser(e.record);
  e.next();
}, "rsvps");

onRecordUpdateRequest((e) => {
  require(`${__hooks}/shared.js`).requireGuestNameOrUser(e.record);
  e.next();
}, "rsvps");

onRecordAfterCreateSuccess((e) => {
  const userId = e.record.get("user");
  if (e.record.get("status") === "no" && userId) {
    const event = e.app.findRecordById("events", e.record.get("event"));
    if (event && event.get("cook") === userId) {
      require(`${__hooks}/shared.js`).reassignCookIfDeclined(e.app, event);
    }
  }
  e.next();
}, "rsvps");

onRecordAfterUpdateSuccess((e) => {
  const userId = e.record.get("user");
  if (e.record.get("status") === "no" && userId) {
    const event = e.app.findRecordById("events", e.record.get("event"));
    if (event && event.get("cook") === userId) {
      require(`${__hooks}/shared.js`).reassignCookIfDeclined(e.app, event);
    }
  }
  e.next();
}, "rsvps");

onRecordCreateRequest((e) => {
  require(`${__hooks}/shared.js`).requireExactlyOneLabel(e.record);
  e.next();
}, "shopping_list_items");

onRecordUpdateRequest((e) => {
  require(`${__hooks}/shared.js`).requireExactlyOneLabel(e.record);
  e.next();
}, "shopping_list_items");
