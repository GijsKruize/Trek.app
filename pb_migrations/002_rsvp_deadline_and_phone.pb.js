/// <reference path="../pb_data/types.d.ts" />

// Adds: events.rsvp_deadline (organizer-set cutoff for locking in RSVPs —
// see pb_hooks/shared.js `isRsvpLocked` equivalent in the Next.js app) and
// users.phone (optional, shown to attendees once RSVPs are locked so they
// can text the organizer directly instead of RSVPing late).

migrate((app) => {
  const events = app.findCollectionByNameOrId("events");
  events.fields.add(new DateField({ name: "rsvp_deadline" }));
  app.save(events);

  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new TextField({ name: "phone", max: 30 }));
  app.save(users);
}, (app) => {
  const events = app.findCollectionByNameOrId("events");
  events.fields.remove("rsvp_deadline");
  app.save(events);

  const users = app.findCollectionByNameOrId("users");
  users.fields.remove("phone");
  app.save(users);
});
