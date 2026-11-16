# HANDOVER

Read this first in any new session. Pick up from **Next steps**.

## Project overview

**Trek?** ("Het eten dat voor iedereen aan tafel werkt.") is a Dutch-language web app for shared meals in student houses, sororities and friend groups: a recipe feed with sponsored cards, group dining events (loose and recurring, with cook rotation), surprise meals, equal cost splitting, and no-login guest RSVPs via a share link. Stack: Next.js 16 (App Router, TypeScript, Tailwind v4, shadcn/ui on Radix) + PocketBase (self-hosted). Brand reference: the brandbook excerpted in the original init prompt — Bloem/Aubergine/Paprika/Saffraan palette, Bricolage Grotesque + Figtree type, "Swipe → Match → Eet."

## Current state

Everything below is implemented and has been exercised end-to-end against a running PocketBase instance (not just type-checked) — see "How this was verified."

- **Backend (PocketBase)**: full schema (`pb_migrations/001_initial_schema.pb.js`), all API rules, and all custom hooks (`pb_hooks/`) — group admin sync + last-admin guard, founding-admin-on-group-create, cook-only field guard on events, invite redemption, the two public share routes, recurring-series occurrence generation, daily horizon top-up, cook-reassignment-on-decline. See `docs/schema.md`.
- **Auth**: register/login/logout (`src/app/(auth)/`), the browser↔httpOnly-cookie session bridge (`src/lib/pocketbase/{client,server}.ts`, `src/app/api/auth/session/route.ts`), route gating (`src/proxy.ts` — Next 16 renamed `middleware.ts` to `proxy.ts`; the codemod did this).
- **Feed**: recipe cards (order shuffled per request — `src/lib/api/recipes.ts`) interleaved with ad cards (`AD_INTERVAL` in `src/lib/constants/feed.ts`), per-viewer diet/allergy warning badges computed server-side (`src/lib/api/diet.ts`). Three of the ads are "real"-brand placeholders (Albert Heijn, a fictional "Viper Energy", Nike) with photos sourced from Wikimedia Commons for local-demo purposes — see `scripts/seed-assets/`.
- **Recepten**: every recipe card links to `/recepten/[recipeId]` — photo, servings/prep time, ingredient list, allergen/tag chips, and numbered steps parsed out of the `instructions` text.
- **Eten (events)**: chronological list of loose + group events with one-tap RSVP; creation form (`eten/nieuw`) now offers a group picker (any group you belong to, or "loose") and an RSVP deadline ("day before"/"day of" + time) instead of a recipe picker. Event detail shows RSVP, surprise gate + reveal, cost split, shopping list (add/check), share-link management, and:
  - **Allergy-aware recipe picker**: the recipe is deliberately *not* chosen at creation. Once attendees have RSVP'd, the organizer picks the meal from `RecipePicker`, which flags which attendees each option conflicts with (`getRecipeOptions` in `src/lib/api/recipes.ts`). See docs/schema.md's `event_meals` section.
  - **Pending group members**: "Wie komt er?" shows every group member, not just the ones who've RSVP'd — the rest show as "pending".
  - **RSVP deadline lock**: past `rsvp_deadline`, RSVP buttons are replaced by a "text/email the organizer" prompt (`RsvpDeadlinePassed`), and the cutoff is enforced server-side too (`pb_hooks/rsvp_deadline_guard.pb.js` for members, a check inside `pb_hooks/share.pb.js` for guests) — not just hidden in the UI.
- **Groups**: create a group (you become its founding admin automatically), member list, invite code generation/rotation, join-by-code (`profiel/groepen/meedoen`).
- **Profiel**: name/email, dieetwensen (diet tags + ingredient-level allergies), groups list.
- **Public sharing**: `/share/[token]` — no login, respects the surprise rule, guest RSVP by name.

### What's implemented but has no frontend entry point yet

The PocketBase side fully supports these (verified directly against the API); only the Next.js form is missing:

- **Creating a recurring `event_series`** (weekly/biweekly/monthly, cook rotation). The seed script creates one through the normal API and it generates occurrences correctly via the `series.pb.js` hook — there's just no "nieuw" form for it yet, only for loose events.
- **Creating a one-off *group* event** (as opposed to loose or series-generated). The create rule is verified working; `eten/nieuw` currently only ever creates loose events (`group: ""`).
- **Manually editing `cook_rotation_order`** after a series is created, or manually reassigning a single occurrence's cook.

## Architecture & decisions

Full schema + rule-by-rule rationale: **`docs/schema.md`**. The short version of what's worth knowing before touching the backend:

- **PocketBase fields must be added via `collection.fields.add(...)`, not the `Collection` constructor's `fields` option.** On this PocketBase build (v0.40.6), fields passed through the constructor aren't indexed in time for a same-call rule referencing them, and fail with "unknown field". Every collection in the migration follows the `fields.add()` pattern for this reason.
- **A hook callback (`onRecordX*`, `routerAdd`, `cronAdd`) cannot see sibling top-level `function`/`const` declarations in the same `.pb.js` file**, even though the file loads without error. Each registered callback runs in its own invocation context later, not the file's load-time scope. Fix: put shared logic in `pb_hooks/shared.js` (no `.pb.js` suffix, so it's not auto-registered as a hook) and `require(`${__hooks}/shared.js`)` inside every callback that needs it — see the comment at the top of `group_admin_sync.pb.js`. This cost real debugging time; don't reintroduce it.
- **`app.findFirstRecordByFilter()` throws (Go's `sql.ErrNoRows`) when nothing matches**, instead of returning a falsy value — unlike `findRecordsByFilter`, which returns `[]`. Every "does this exist?" check goes through `shared.tryFindFirst()`.
- **PocketBase date-field values from `.get()` are a wrapper object that's always JS-truthy**, even when conceptually empty/unset (`if (event.get("revealed_at"))` is always true). The only reliable check is `shared.parsePbDate(value)` (attempts the parse, returns `null` on failure) — never test a date field's truthiness directly.
- **JSON fields (e.g. `cook_rotation_order`) come back from `.get()` inconsistently** — sometimes a real array, sometimes a raw array of UTF-8 byte codes representing the JSON text. Always run them through `shared.asArray()`.
- **Creating a group, and redeeming an invite, both have the same chicken-and-egg problem**: `group_members.createRule` requires `group.admins ?= @request.auth.id`, which a brand-new group or a not-yet-member can never satisfy. Groups: solved by `group_create.pb.js` (auto-creates the founding admin membership after `e.next()`). Invites: solved by a dedicated authenticated route (`invites.pb.js`) that writes with elevated privileges instead of going through the generic collection create.
- **Surprise-meal redaction is a collection split (`event_meals`), not a redaction proxy route** — the event itself stays on the plain `events` record with simple rules and full realtime support; only the actually-secret field (`recipe`) lives in `event_meals` with the reveal predicate baked into its own rule. Revealing sets `events.revealed_at` *and* re-saves the `event_meals` row so its own realtime subscribers get notified (an `events` update alone wouldn't push to them).
- **Public sharing is two routes (`share.pb.js`), not a rule-only trick** — `events.share_token` is a dedicated random value (client-generated via `nanoid`, not server-generated), and the real event `id` is never in the public JSON payload.
- **Auth session plumbing**: the PocketBase JS SDK's browser `authStore` lives in `localStorage`, invisible to Server Components/`proxy.ts`. Login runs client-side (`useAuth().login`), then POSTs the token+record to `/api/auth/session`, which sets an httpOnly cookie that `proxy.ts` and `getServerPocketBase()` read. **Both sides must be kept in sync on logout** (`useAuth().logout` clears localStorage and calls `DELETE /api/auth/session`) — if you add another way to end a session, clear both.
- **`PocketBase.autoCancellation` must be `false` on the server client** (`getServerPocketBase()` sets this). The SDK auto-cancels concurrent requests to the same endpoint path by default (meant for a browser typing quickly); it has no purpose on a fresh per-request server client and silently aborts `Promise.all()` fan-out reads (this broke `getFeed`'s per-recipe ingredient fetch until found).
- **Component library**: shadcn/ui on Radix primitives (`src/components/ui/`), restyled entirely with Trek's own CSS variables in `src/app/globals.css` — shadcn's generated color values were replaced, its utility/animation plumbing (`shadcn/tailwind.css` import, `tw-animate-css`) was kept.
- **Diet-conflict checking is one function** (`src/lib/api/diet.ts`), run server-side inside `lib/api/recipes.ts`, attaching `dietWarnings[]` to the DTO. Badge components are purely presentational.

### How this was verified

The backend was tested directly against a running `pocketbase serve` with `curl` (not just read for correctness) — collection creation, rule enforcement, every hook (group admin sync, last-admin guard, cook rotation + reassignment-on-decline, surprise reveal, guest RSVP, invite redemption, group founding-admin). The frontend was built, then exercised with `npm run build` (catches type errors + SSR crashes) and `curl` against `npm run dev` with real session cookies for all four seeded demo users, confirming each page returns 200 and the expected content (diet warnings differ correctly per viewer, event titles/recipes/attendees render, the share page respects the surprise rule). **No one has looked at this in an actual browser** — no visual/interaction QA has been done. Do that before calling any of this "done" in a user-facing sense.

## Setup

See `README.md`. Short version: `npm install`, `npm run pb` (+ `npm run pb:superuser` once), `npm run dev`, `npm run db:seed`. Demo logins are in the README.

## Next steps

Roughly in priority order:

1. **Look at it in a real browser**, mobile-first (320/375/390px), both themes. Nothing in this session was visually verified — the hand-drawn SVG wordmark especially (see Known issues) and general layout/spacing deserve a real look.
2. **Recurring-series creation form.** The backend is done (`event_series` + `series.pb.js`); build an `eten/nieuw` variant (or a tab on the existing form) for weekly/biweekly/monthly + cook rotation roster, posting to `event_series` instead of `events`.
3. ~~One-off group event creation.~~ Done — `eten/nieuw` now has a group picker.
4. **Cook rotation management UI** on the group or series: view/reorder `cook_rotation_order`, manually reassign a single occurrence.
5. **Ingredient-based shopping list items**, not just free-text `custom_label` — an ingredient picker/autocomplete against the `ingredients` collection.
6. **Group image / user avatar upload** — forms exist for everything else in Profiel; these two file fields are currently only settable via the PocketBase dashboard.
7. Automated tests. None exist yet — not scoped in the original brief, but worth having before this grows further.

## Known issues & technical debt

- **The drawn wordmark (`src/components/brand/TrekWordmark.tsx`, `TrekMark.tsx`) is a simplified geometric monoline placeholder**, not a hand-tuned bespoke letterform set. It satisfies the brief's "drawn, not typeset" constraint (real SVG paths, not a `<text>` element) but a human designer should refine the actual letterforms before this ships for real. Flagged in the component files themselves too.
- **`getFeed`/`getRecipeDetail` (`src/lib/api/recipes.ts`) do one `recipe_ingredients` query per recipe** (N+1), run in parallel via `Promise.all`. Fine at demo scale (a handful of recipes); worth batching into a single `recipe_ingredients` query filtered by `recipe IN (...)` if the catalog grows.
- **Guest RSVPs have no durable identity** (no account), so resubmitting the share page's RSVP form creates a new `rsvps` row rather than updating the previous one. Documented, accepted limitation for v1 — see `docs/schema.md`.
- **No realtime subscriptions.** The original plan considered wiring `pb.collection('rsvps').subscribe(...)` on the event detail page; this session used optimistic client updates + `router.refresh()` instead, to keep scope manageable. `event_meals`'s realtime-on-reveal plumbing (the `events` update + `event_meals` touch) is in place server-side if this gets picked up later.
- **`events.createRule`'s relation-chain filter** (`@request.body.group.group_members_via_group.user ?= @request.auth.id`) **was verified by direct API test, not through a UI path** (see Next steps #3) — keep that in mind if it starts misbehaving after a PocketBase upgrade.
- The `@now` filter macro (used in the surprise-reveal-by-date rules) is confirmed present in PocketBase v0.40.6, the pinned version (`pocketbase/pocketbase --version`). If a future upgrade ever drops it, see the fallback noted in `docs/schema.md`.
- **In this dev environment, `pocketbase serve`'s `--hooksWatch` (on by default, and what `npm run pb` uses) gets stuck restarting every ~2s indefinitely** after the first `pb_hooks/*` edit of a session, even once no further edits are happening and regardless of which file triggered it first — confirmed it's not an actual file mtime change. Workaround: append `--hooksWatch=false` to the `pb` script's command (or run the binary directly with that flag) and manually restart after editing a hook. Not yet root-caused; may be specific to this container's filesystem event delivery rather than a PocketBase bug on real hardware — verify on a normal machine before "fixing" it for real.
- **The recipe picker, RSVP-deadline-lock notice, and new recipe detail page haven't been eyeballed in an actual browser yet this session** — verified via `npm run build`, `tsc --noEmit`, `eslint`, and `curl` with real session cookies (status codes + grepping rendered HTML for the expected conflict/pending-member markup), matching this project's existing verification bar, but see "Look at it in a real browser" above — that applies to all of this new UI too.

## Deviations from the init prompt

- **`events.invitees`** (relation→users, multi) was added beyond the brief's guest-link flow, so a registered friend can RSVP as themselves on someone else's loose event (with real diet-conflict checking, appearing on their own Eten page). Additive, doesn't replace the guest-link flow.
- **Component library choice**: the brief said "Tailwind CSS" without naming a component library; shadcn/ui (on Radix) was chosen and is documented in `docs/schema.md`'s architecture plan — copy-in Radix primitives, not a themed runtime dependency, so Trek's own tokens fully replace shadcn's defaults rather than fighting them.
- **`ads.image` is optional, not required** — the brief says food imagery is "illustrated placeholders until real photos exist," which conflicts with a hard-required file field; recipes' image was already optional for the same reason, ads now matches.
- **`created`/`updated` `AutodateField`s were added to every collection**, not explicitly requested in the brief, because several pieces of app code (and PocketBase's own sort defaults) assume they exist.
- See "Current state → what's implemented but has no frontend entry point yet" for scope that's real on the backend but not yet reachable from the UI — those are gaps to close, not intentional design deviations.
