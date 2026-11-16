/// <reference path="../pb_data/types.d.ts" />

// Enforces events.rsvp_deadline server-side — the Next.js app hides the
// RSVP buttons once the cutoff passes, but that's cosmetic on its own;
// a direct API call could still slip a late RSVP through this collection's
// normal create/update rules otherwise.
//
// The actual check lives in shared.js's `requireRsvpNotLocked` — a hook
// callback can't see a sibling top-level function declared in this same
// file (see the note in group_admin_sync.pb.js), so it can't be a local
// helper here.

onRecordCreateRequest((e) => {
  require(`${__hooks}/shared.js`).requireRsvpNotLocked(e.app, e.record);
  e.next();
}, "rsvps");

onRecordUpdateRequest((e) => {
  require(`${__hooks}/shared.js`).requireRsvpNotLocked(e.app, e.record);
  e.next();
}, "rsvps");
