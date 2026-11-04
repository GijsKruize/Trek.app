# PocketBase schema

Source of truth for the schema is the migration at `pb_migrations/001_initial_schema.pb.js`. This document is the human-readable companion — if the two ever disagree, trust the migration and update this file.

Rule legend: `null` = superuser/dashboard only. `""` = public, no restriction. Anything else is the literal PocketBase filter expression.

## Fixed enums

- **Diet tags** (`users.diet_tags`, used for matching): `vegetarisch, vegan, glutenvrij, lactosevrij, halal, kosjer, pescotarisch`
- **Ingredient tags** (`ingredients.tags`): `noten, pinda, zuivel, lactose, gluten, ei, vis, schaaldieren, soja, vlees, varkensvlees, rundvlees, pluimvee, peulvruchten, alcohol, honing`
- **Units** (`recipe_ingredients.unit`, `shopping_list_items.unit`): `gram, kilogram, ml, liter, stuk, el, tl, snufje, teentje, bosje, blik, pak`

These are plain `select` fields, not their own collections — they're small, app-curated, and not user-editable, so a join buys nothing. The diet→excluded-ingredient-tag mapping (e.g. `vegetarisch` excludes `vlees`/`vis`/…) lives in `src/lib/constants/dietTags.ts`, since it's a product decision, not content. Allergies are the one thing modeled as a relation (`users.allergy_ingredients` → `ingredients`), because the brief specifically wants ingredient-level checks (e.g. "pinda").

## Collections

### `users` (built-in auth, extended)
Custom fields: `name` (text, required), `avatar` (file), `diet_tags` (select, multi), `allergy_ingredients` (relation→ingredients, multi).
Rules: list/view `@request.auth.id != ""` — any logged-in user can see another's name/diet info (low-sensitivity, needed so cooks/organizers see attendee diets). create `""`. update/delete `id = @request.auth.id`.

### `groups`
Fields: `name`, `address` (default event location), `image`, `admins` (relation→users, multi, **denormalized**).
Rules: list/view `group_members_via_group.user ?= @request.auth.id`. create `@request.auth.id != ""`. update/delete `admins ?= @request.auth.id`.

`admins` is denormalized onto the group record (synced by `pb_hooks/group_admin_sync.pb.js`) instead of filtering live off `group_members.role`, because combining two conditions on the same multi-valued back-relation (`group_members_via_group.user ?= X && …role ?= "admin"`) does not reliably mean "the same row satisfies both" in PocketBase's filter engine. A flat field sidesteps that everywhere admin rights are checked.

### `group_members`
Fields: `group`, `user`, `role` (`admin`|`member`). Unique on `(group, user)`.
Rules: list/view `group.group_members_via_group.user ?= @request.auth.id`. create/update `group.admins ?= @request.auth.id`. delete `user = @request.auth.id || group.admins ?= @request.auth.id`.

### `group_invites`
Fields: `group`, `code` (unique), `created_by`, `max_uses`, `uses_count`, `expires_at`, `revoked`.
Rules: every operation `group.admins ?= @request.auth.id`.

Redemption does **not** go through the generic REST create — a not-yet-member can't satisfy `group.admins` to add themselves. `POST /api/trek/invites/redeem` (`pb_hooks/invites.pb.js`, `$apis.requireAuth()`) validates the code server-side (not revoked, not expired, under `max_uses`) and inserts the `group_members` row directly with elevated privileges.

### `ingredients`
Fields: `name`, `tags` (multi-select), `unit_default`.
Rules: list/view `""` (public — the share page needs to resolve ingredient names without a proxy). write `null` (seed/admin only).

### `recipes`
Fields: `title`, `description`, `image`, `servings`, `instructions`, `prep_minutes`, `is_published`.
Rules: list/view `is_published = true`. write `null`.

### `recipe_ingredients`
Fields: `recipe`, `ingredient`, `quantity`, `unit`, `note`, `sort_order`.
Rules: list/view `recipe.is_published = true`. write `null`.

### `ads`
Fields: `title`, `teaser`, `image`, `link_url`, `active`, `starts_at`, `ends_at`, `sort_weight`.
Rules: list/view `active = true`. write `null`. Date-window scheduling (`starts_at`/`ends_at`) is applied in feed-assembly app code, not the filter.

### `event_series` (recurring definition)
Fields: `group` (optional — empty means personal series), `organizer`, `title`, `default_recipe`, `default_location`, `rrule_freq` (`weekly`|`biweekly`|`monthly`), `rrule_byweekday`, `start_time` (`HH:mm`), `start_date`, `end_date`, `cook_rotation_enabled`, `cook_rotation_order` (json array of user ids), `cook_rotation_pointer`, `surprise_default`, `active`.
Rules: list/view `organizer = @request.auth.id || (group != "" && group.group_members_via_group.user ?= @request.auth.id)`. create `@request.auth.id != "" && (group = "" || group.group_members_via_group.user ?= @request.auth.id)`. update/delete `organizer = @request.auth.id || (group != "" && group.admins ?= @request.auth.id)`.

### `events` (every occurrence — loose/group × one-off/generated)
Fields: `series` (optional), `group` (optional), `organizer`, `invitees` (relation→users, multi — see deviation note below), `title`, `starts_at`, `location`, `cook`, `is_surprise`, `revealed_at`, `total_cost_cents`, `status` (`scheduled`|`cancelled`), `share_token` (unique, sparse).

`recipe` is **deliberately not a field here** — see the surprise-meal section below.

Rules: list/view `organizer = @request.auth.id || cook = @request.auth.id || invitees ?= @request.auth.id || (group != "" && group.group_members_via_group.user ?= @request.auth.id)`. create `@request.auth.id != "" && @request.body.organizer = @request.auth.id && (@request.body.group = "" || @request.body.group.group_members_via_group.user ?= @request.auth.id)`. update `organizer = @request.auth.id || cook = @request.auth.id || (group != "" && group.admins ?= @request.auth.id)` — `pb_hooks/events_update_guard.pb.js` additionally blocks a cook-only updater from changing `organizer`/`group`/`invitees`/`status`, since rules can't restrict individual fields. delete `organizer = @request.auth.id || (group != "" && group.admins ?= @request.auth.id)`.

**Deviation from the brief:** `invitees` lets a registered friend RSVP as themselves on someone else's loose event (with real diet-conflict checking, appearing on their own Eten page), additive to the guest-link flow which still covers casual/anonymous participation. The brief only specified the guest-link flow explicitly.

### `event_meals` (surprise-gated recipe link)
Fields: `event` (unique), `recipe`.
Rules: list/view —
```
event.is_surprise = false ||
event.revealed_at != "" ||
event.starts_at <= @now ||
event.cook = @request.auth.id ||
event.organizer = @request.auth.id
```
write: `event.organizer = @request.auth.id || (event.group != "" && event.group.admins ?= @request.auth.id)`.

**Why a split collection and not a redaction proxy route:** the event itself (date, attendees, cook, cost) stays on the plain `events` record with simple rules and full realtime support; only the genuinely secret field (`recipe`) lives behind its own rule with the reveal predicate baked in. A hand-rolled proxy route would mean reimplementing pagination/filter/sort/realtime for every place an event is read, for a redaction need that only concerns two sub-resources. Revealing a meal sets `events.revealed_at` **and** re-saves the linked `event_meals` row, so its own realtime subscribers get notified too (an update to `events` alone wouldn't push a realtime event to `event_meals` subscribers).

### `shopping_list_items`
Fields: `event`, `ingredient` (optional), `custom_label` (exactly one of ingredient/custom_label, enforced by `pb_hooks/rsvp_guard.pb.js`), `quantity`, `unit`, `checked`, `added_by`.
Rules: list/view — cook/organizer always; otherwise the same reveal predicate as `event_meals`, AND (`invitees` or group membership). write: `event.organizer = @request.auth.id || event.cook = @request.auth.id`.

### `rsvps` (member + guest)
Fields: `event`, `user` (optional — empty means guest), `guest_name` (required when `user` is empty), `status` (`yes`|`no`). Unique on `(event, user)` where `user != ''`.
Rules: list/view `user = @request.auth.id || event.organizer = @request.auth.id || event.cook = @request.auth.id || event.invitees ?= @request.auth.id || (event.group != "" && event.group.group_members_via_group.user ?= @request.auth.id)`. create `@request.auth.id != "" && @request.body.user = @request.auth.id && (…same membership check…)` — **no anonymous branch**; guest RSVPs never go through this rule. update `user = @request.auth.id`. delete `user = @request.auth.id || event.organizer = @request.auth.id || (event.group != "" && event.group.admins ?= @request.auth.id)`.

## Public sharing

Rejected approaches: reusing the event's own `id` as the share token (conflates primary key with a security capability, can't truly revoke), and a `@request.query.token`-matching rule (the record is addressed by id, not token — there's no rule-only path to resolve token→record without reopening enumeration on a public `listRule`).

**Chosen:** `events.share_token` is a dedicated random value (24+ chars, `nanoid` client-side), reissued on every (re-)enable and cleared on revoke via a normal authenticated `events` update — the organizer already has update rights on their own event, so no custom route is needed for issuing/revoking the token itself. Two public routes in `pb_hooks/share.pb.js` handle everything that needs to work *without* auth:

- `GET /api/trek/share/{token}` — resolves the event via `$app.findFirstRecordByFilter` with elevated privileges (this is application code, not a rule-checked REST call), 404s on no/empty match, applies the reveal predicate, and returns a hand-assembled minimal JSON projection (title, time, location, organizer/cook display names, recipe only if revealed, RSVP yes/no counts). **The real event `id` is never in the response.** Cost/shopping-list are intentionally left out of the public payload — those are organizer/attendee planning tools, not needed to decide whether to come.
- `POST /api/trek/share/{token}/rsvp` — body `{name, status}`, re-resolves the event by token (never trusts a client-supplied id), inserts an `rsvps` row with `user` empty via the system DAO.

Known limitation: a guest has no durable identity, so resubmitting the form creates a new RSVP row rather than updating the previous one. Acceptable for v1; documented in `HANDOVER.md`.

## Recurring occurrence generation & cook rotation

- `event_series`'s `onRecordAfterCreateSuccess` hook generates the first ~8 weeks of occurrences immediately.
- A daily cron (`cronAdd("extend-occurrences", "0 3 * * *", …)` in `pb_hooks/occurrences_cron.pb.js`) tops up every active series to a rolling 8-week horizon, idempotently (checks for an existing row at the target date before inserting).
- Cook rotation state (`cook_rotation_order` + `cook_rotation_pointer`) lives directly on `event_series` — one pointer per series needs no separate table. Generation eagerly assigns `cook = order[pointer % length]` and advances the pointer; each occurrence keeps its own `cook`, so history survives later pointer movement, and an organizer can override a single occurrence without disturbing the series. A follow-up check (on RSVP write, and a few days pre-event via the same cron) reassigns if the current cook RSVP's "no", skipping to the next person who RSVP'd "yes"; if nobody eligible has answered yet, it's left flagged for the organizer rather than guessed.

## Supporting hooks

| File | Purpose |
|---|---|
| `shared.js` | Helper functions (occurrence generation, cook reassignment, reveal check) used by the other hook files via `require(`${__hooks}/shared.js`)`. Deliberately not named `*.pb.js` — each auto-loaded hook file runs in its own scope, so top-level declarations don't leak across files; `require()` is PocketBase's supported way to share code between them. |
| `group_create.pb.js` | Creates the founding admin `group_members` row right after a new group is persisted — same chicken-and-egg problem as invite redemption (a brand-new group has no admins yet, so the creator can't satisfy `group.admins ?= @request.auth.id` to add themselves). |
| `group_admin_sync.pb.js` | Keeps `groups.admins` in sync with `group_members`; blocks demoting/removing the last admin. |
| `events_update_guard.pb.js` | Blocks a cook-only updater of `events` from changing `organizer`/`group`/`invitees`/`status`. |
| `validation_guards.pb.js` | Enforces `guest_name` required when `rsvps.user` is empty, exactly one of `ingredient`/`custom_label` on `shopping_list_items`, and triggers cook reassignment when an assigned cook RSVPs "no". |
| `invites.pb.js` | `POST /api/trek/invites/redeem`. |
| `share.pb.js` | The two public share routes. |
| `series.pb.js` | Generates the first occurrences when an `event_series` is created. |
| `occurrences_cron.pb.js` | Daily horizon top-up + cook-reassignment reconciliation. |

## Known version dependency

The reveal predicate's `event.starts_at <= @now` clause depends on the `@now` filter macro, confirmed present in PocketBase v0.40.6 (the pinned version — see `pocketbase/pocketbase --version`). If a future PocketBase upgrade ever drops or changes this macro, replace that clause with a small `onRecordEnrich`/view-hook check against server time instead of the filter.
