// Shared helpers for the other pb_hooks/*.pb.js files, loaded via
// `require(`${__hooks}/shared.js`)`. Deliberately NOT named *.pb.js — that
// suffix is auto-registered as a top-level hook script by PocketBase, and
// top-level function/const declarations in one such file are NOT visible
// to another (each runs in its own scope); require()'d CommonJS modules
// are the supported way to share code across hook files.

// JSONField values come back from .get() as whatever the underlying Go
// []byte happened to deserialize to in this build — sometimes a real
// array of strings, sometimes a JSON-encoded string, sometimes a raw
// array of UTF-8 byte codes (i.e. the JSON text, one char per array
// slot). Always normalize before indexing into it.
function asArray(value) {
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "number") {
    try {
      value = value
        .map(function (code) {
          return String.fromCharCode(code);
        })
        .join("");
    } catch (err) {
      return [];
    }
  }
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
}

function weekdayIndex(day) {
  return { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }[day];
}

function stepDaysForFreq(freq) {
  if (freq === "weekly") return 7;
  if (freq === "biweekly") return 14;
  if (freq === "monthly") return 30; // approximate; fine for a rolling horizon top-up
  return 7;
}

// PocketBase date fields come back from .get() as a wrapper object that is
// *always* JS-truthy, even when conceptually empty/unset — `if (field)` or
// `field ? ... : null` never works for them. The only reliable check is to
// attempt the parse and see if the result is a valid date.
function parsePbDate(value) {
  if (value === null || value === undefined) return null;
  const parsed = new Date(String(value).trim().replace(" ", "T"));
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatPbDate(date) {
  return date.toISOString().replace("T", " ");
}

// app.findFirstRecordByFilter() throws (Go's sql.ErrNoRows bubbling up as a
// JS exception) when nothing matches, instead of returning a falsy value —
// unlike findRecordsByFilter, which returns an empty array. Every "does
// this exist?" check needs this wrapper.
function tryFindFirst(app, collection, filter, params) {
  try {
    return app.findFirstRecordByFilter(collection, filter, params || {});
  } catch (err) {
    return null;
  }
}

function nextWeekdayOnOrAfter(date, targetWeekday) {
  const d = new Date(date.getTime());
  const diff = (targetWeekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

// JS Date objects (UTC) for every occurrence of `series` within the next
// `weeksAhead` weeks from `fromDate`, bounded by series.end_date.
function occurrenceDatesForSeries(series, fromDate, weeksAhead) {
  const freq = series.get("rrule_freq");
  const weekday = weekdayIndex(series.get("rrule_byweekday"));
  const startTimeParts = (series.get("start_time") || "18:00").split(":");
  const hh = parseInt(startTimeParts[0], 10);
  const mm = parseInt(startTimeParts[1], 10);

  const seriesStart = parsePbDate(series.get("start_date")) || fromDate;
  const seriesEnd = parsePbDate(series.get("end_date"));
  const horizon = new Date(fromDate.getTime() + weeksAhead * 7 * 24 * 3600 * 1000);
  const earliest = seriesStart.getTime() > fromDate.getTime() ? seriesStart : fromDate;

  let cursor = nextWeekdayOnOrAfter(earliest, weekday);
  const stepMs = stepDaysForFreq(freq) * 24 * 3600 * 1000;
  const dates = [];

  while (cursor.getTime() <= horizon.getTime()) {
    if (!seriesEnd || cursor.getTime() <= seriesEnd.getTime()) {
      const occurrence = new Date(cursor.getTime());
      occurrence.setUTCHours(hh, mm, 0, 0);
      dates.push(occurrence);
    }
    cursor = new Date(cursor.getTime() + stepMs);
  }
  return dates;
}

// Idempotent: safe to call repeatedly (on series create, and from the daily
// cron) — skips any date that already has an events row for this series.
function ensureOccurrencesForSeries(app, series) {
  const OCCURRENCE_HORIZON_WEEKS = 8;
  const now = new Date();
  const dates = occurrenceDatesForSeries(series, now, OCCURRENCE_HORIZON_WEEKS);

  const rotationEnabled = series.get("cook_rotation_enabled");
  const rotationOrder = asArray(series.get("cook_rotation_order"));
  let pointer = series.get("cook_rotation_pointer") || 0;
  let pointerChanged = false;

  for (let i = 0; i < dates.length; i++) {
    const startsAt = formatPbDate(dates[i]);
    const existing = tryFindFirst(app, "events", "series = {:series} && starts_at = {:startsAt}", {
      series: series.id,
      startsAt: startsAt,
    });
    if (existing) continue;

    const eventsCollection = app.findCollectionByNameOrId("events");
    const event = new Record(eventsCollection);
    event.set("series", series.id);
    event.set("group", series.get("group") || "");
    event.set("organizer", series.get("organizer"));
    event.set("title", series.get("title") || "");
    event.set("starts_at", startsAt);
    event.set("location", series.get("default_location") || "");
    event.set("is_surprise", !!series.get("surprise_default"));
    event.set("status", "scheduled");

    if (rotationEnabled && rotationOrder.length > 0) {
      event.set("cook", rotationOrder[pointer % rotationOrder.length]);
      pointer = pointer + 1;
      pointerChanged = true;
    }

    app.save(event);

    const defaultRecipe = series.get("default_recipe");
    if (defaultRecipe) {
      const mealsCollection = app.findCollectionByNameOrId("event_meals");
      const meal = new Record(mealsCollection);
      meal.set("event", event.id);
      meal.set("recipe", defaultRecipe);
      app.save(meal);
    }
  }

  if (pointerChanged) {
    series.set("cook_rotation_pointer", pointer % Math.max(rotationOrder.length, 1));
    app.save(series);
  }
}

// If the currently assigned cook for an upcoming event has RSVP'd "no",
// reassign to the next person in the series rotation order who has RSVP'd
// "yes". Leaves the cook as-is (flagged for the organizer) if nobody
// eligible has answered yet.
function reassignCookIfDeclined(app, event) {
  const seriesId = event.get("series");
  if (!seriesId) return;
  const series = app.findRecordById("event_series", seriesId);
  if (!series || !series.get("cook_rotation_enabled")) return;

  const rotationOrder = asArray(series.get("cook_rotation_order"));
  if (rotationOrder.length === 0) return;

  const yesRsvps = app.findRecordsByFilter(
    "rsvps",
    "event = {:event} && status = 'yes' && user != ''",
    "",
    200,
    0,
    { event: event.id }
  );
  const yesUserIds = yesRsvps.map(function (r) {
    return r.get("user");
  });

  const currentCook = event.get("cook");
  const currentIndex = rotationOrder.indexOf(currentCook);
  const startIndex = currentIndex === -1 ? 0 : currentIndex;

  for (let i = 1; i <= rotationOrder.length; i++) {
    const candidate = rotationOrder[(startIndex + i) % rotationOrder.length];
    if (candidate !== currentCook && yesUserIds.indexOf(candidate) !== -1) {
      event.set("cook", candidate);
      app.save(event);
      return;
    }
  }
}

function syncGroupAdmins(app, groupId) {
  if (!groupId) return;
  const group = app.findRecordById("groups", groupId);
  if (!group) return;

  const adminRows = app.findRecordsByFilter("group_members", "group = {:group} && role = 'admin'", "", 200, 0, {
    group: groupId,
  });
  group.set(
    "admins",
    adminRows.map(function (r) {
      return r.get("user");
    })
  );
  app.save(group);
}

function countGroupAdmins(app, groupId) {
  return app.findRecordsByFilter("group_members", "group = {:group} && role = 'admin'", "", 200, 0, {
    group: groupId,
  }).length;
}

function requireGuestNameOrUser(record) {
  if (!record.get("user") && !record.get("guest_name")) {
    throw new BadRequestError("guest_name is verplicht wanneer er geen gebruiker gekoppeld is.");
  }
}

function requireExactlyOneLabel(record) {
  const hasIngredient = !!record.get("ingredient");
  const hasCustomLabel = !!record.get("custom_label");
  if (hasIngredient === hasCustomLabel) {
    throw new BadRequestError("Kies precies één van ingredient of custom_label.");
  }
}

function isMealRevealed(event) {
  if (!event.get("is_surprise")) return true;
  if (parsePbDate(event.get("revealed_at"))) return true;
  const startsAt = parsePbDate(event.get("starts_at"));
  if (startsAt && startsAt.getTime() <= Date.now()) return true;
  return false;
}

// Mirrors the Next.js app's `isRsvpLocked` (src/lib/api/events.ts) — kept
// here too so the guard below and the public share route enforce the same
// cutoff server-side, not just the UI hiding the buttons.
function isRsvpLocked(event) {
  const deadline = parsePbDate(event.get("rsvp_deadline"));
  return !!deadline && deadline.getTime() <= Date.now();
}

// Used by rsvp_deadline_guard.pb.js on both create and update — lives here
// (not as a second top-level function in that file) because a hook
// callback can't see a sibling top-level declaration in the same .pb.js
// file (see the note in group_admin_sync.pb.js).
//
// No organizer/group-admin bypass here: rsvps.updateRule is already
// strictly `user = @request.auth.id` (and createRule requires
// `@request.body.user = @request.auth.id`), so this hook is only ever
// reached by the RSVP's own owner in the first place — there's no
// "someone else editing this row" case to carve an exception for.
function requireRsvpNotLocked(app, record) {
  const event = app.findRecordById("events", record.get("event"));
  if (event && isRsvpLocked(event)) {
    throw new ForbiddenError("RSVP's zijn gesloten voor dit etentje. Neem contact op met de organisator.");
  }
}

module.exports = {
  tryFindFirst: tryFindFirst,
  ensureOccurrencesForSeries: ensureOccurrencesForSeries,
  reassignCookIfDeclined: reassignCookIfDeclined,
  isMealRevealed: isMealRevealed,
  isRsvpLocked: isRsvpLocked,
  requireRsvpNotLocked: requireRsvpNotLocked,
  syncGroupAdmins: syncGroupAdmins,
  countGroupAdmins: countGroupAdmins,
  requireGuestNameOrUser: requireGuestNameOrUser,
  requireExactlyOneLabel: requireExactlyOneLabel,
};
