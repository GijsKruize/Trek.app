import type PocketBase from "pocketbase";
import { nanoid } from "nanoid";
import type {
  EventSeries,
  Group,
  GroupMember,
  Recipe,
  RecipeIngredient,
  Rsvp,
  ShoppingListItemExpanded,
  TrekEvent,
  TrekUser,
  Weekday,
} from "@/lib/pocketbase/types";

interface EventExpanded extends TrekEvent {
  expand?: { organizer?: TrekUser; cook?: TrekUser; group?: Group };
}

export type RsvpStatus = "yes" | "no" | "pending";

export interface UpcomingEvent {
  event: EventExpanded;
  myStatus: RsvpStatus;
}

export async function getUpcomingEvents(pb: PocketBase, userId: string): Promise<UpcomingEvent[]> {
  const filter = `(organizer = "${userId}" || cook = "${userId}" || invitees ?= "${userId}" || group.group_members_via_group.user ?= "${userId}") && status = "scheduled"`;
  const events = await pb.collection("events").getFullList<EventExpanded>({
    filter,
    sort: "starts_at",
    expand: "organizer,cook,group",
  });

  if (events.length === 0) return [];

  const rsvps = await pb.collection("rsvps").getFullList<Rsvp>({
    filter: `user = "${userId}"`,
  });
  const statusByEvent = new Map(rsvps.map((r) => [r.event, r.status as RsvpStatus]));

  return events.map((event) => ({ event, myStatus: statusByEvent.get(event.id) ?? "pending" }));
}

export interface EventDetail {
  event: EventExpanded;
  attendees: (Rsvp & { expand?: { user?: TrekUser } })[];
  pendingMembers: TrekUser[];
  recipe: Recipe | null;
  revealed: boolean;
  shoppingList: ShoppingListItemExpanded[];
  myStatus: RsvpStatus;
  rsvpLocked: boolean;
}

function isMealRevealed(event: TrekEvent): boolean {
  if (!event.is_surprise) return true;
  if (event.revealed_at) return true;
  return new Date(event.starts_at).getTime() <= Date.now();
}

/** Once the organizer's RSVP cutoff has passed, the guest list is
 * considered final — RSVP buttons give way to a "text the organizer"
 * prompt instead of accepting a late change. */
export function isRsvpLocked(event: Pick<TrekEvent, "rsvp_deadline">): boolean {
  if (!event.rsvp_deadline) return false;
  return new Date(event.rsvp_deadline).getTime() <= Date.now();
}

export async function getEventDetail(
  pb: PocketBase,
  eventId: string,
  userId: string | null
): Promise<EventDetail> {
  const event = await pb.collection("events").getOne<EventExpanded>(eventId, {
    expand: "organizer,cook,group",
  });

  const attendees = await pb
    .collection("rsvps")
    .getFullList<Rsvp & { expand?: { user?: TrekUser } }>({ filter: `event = "${eventId}"`, expand: "user" });

  const revealed = isMealRevealed(event);
  let recipe: Recipe | null = null;
  if (revealed) {
    try {
      const meal = await pb.collection("event_meals").getFirstListItem(`event = "${eventId}"`, {
        expand: "recipe",
      });
      recipe = (meal as unknown as { expand?: { recipe?: Recipe } }).expand?.recipe ?? null;
    } catch {
      recipe = null;
    }
  }

  let shoppingList: ShoppingListItemExpanded[] = [];
  try {
    shoppingList = await pb.collection("shopping_list_items").getFullList<ShoppingListItemExpanded>({
      filter: `event = "${eventId}"`,
      expand: "ingredient",
      sort: "created",
    });
  } catch {
    shoppingList = [];
  }

  // Group events invite every member implicitly (see events.listRule) —
  // so "who's coming" should show members who haven't responded yet as
  // pending, not just the rows that already exist in `rsvps`.
  let pendingMembers: TrekUser[] = [];
  if (event.group) {
    const respondedUserIds = new Set(attendees.map((a) => a.user).filter(Boolean));
    const members = await pb.collection("group_members").getFullList<GroupMember & { expand?: { user?: TrekUser } }>({
      filter: `group = "${event.group}"`,
      expand: "user",
    });
    pendingMembers = members
      .map((m) => m.expand?.user)
      .filter((u): u is TrekUser => !!u && !respondedUserIds.has(u.id));
  }

  const myStatus: RsvpStatus = userId
    ? ((attendees.find((a) => a.user === userId)?.status as RsvpStatus) ?? "pending")
    : "pending";

  return {
    event,
    attendees,
    pendingMembers,
    recipe,
    revealed,
    shoppingList,
    myStatus,
    rsvpLocked: isRsvpLocked(event),
  };
}

export async function setRsvp(
  pb: PocketBase,
  eventId: string,
  userId: string,
  status: "yes" | "no"
): Promise<void> {
  try {
    const existing = await pb
      .collection("rsvps")
      .getFirstListItem(`event = "${eventId}" && user = "${userId}"`);
    await pb.collection("rsvps").update(existing.id, { status });
  } catch {
    await pb.collection("rsvps").create({ event: eventId, user: userId, status });
  }
}

export async function revealMeal(pb: PocketBase, eventId: string): Promise<void> {
  await pb.collection("events").update(eventId, { revealed_at: new Date().toISOString() });
  // Touch the event_meals row too so its own realtime subscribers get
  // notified — an update to `events` alone doesn't push to them.
  try {
    const meal = await pb.collection("event_meals").getFirstListItem(`event = "${eventId}"`);
    await pb.collection("event_meals").update(meal.id, {});
  } catch {
    // no linked meal — nothing to touch
  }
}

export async function enableShareLink(pb: PocketBase, eventId: string): Promise<string> {
  const token = nanoid(24);
  await pb.collection("events").update(eventId, { share_token: token });
  return token;
}

export async function revokeShareLink(pb: PocketBase, eventId: string): Promise<void> {
  await pb.collection("events").update(eventId, { share_token: "" });
}

export async function createEvent(
  pb: PocketBase,
  data: {
    organizer: string;
    title: string;
    startsAt: string;
    location: string;
    isSurprise: boolean;
    groupId?: string;
    rsvpDeadline?: string;
  }
): Promise<EventExpanded> {
  return pb.collection("events").create<EventExpanded>({
    organizer: data.organizer,
    group: data.groupId ?? "",
    title: data.title,
    starts_at: data.startsAt,
    location: data.location,
    is_surprise: data.isSurprise,
    status: "scheduled",
    rsvp_deadline: data.rsvpDeadline ?? "",
  });
}

/** The recipe is deliberately not chosen at creation — the organizer
 * picks it once RSVPs (and therefore the real guest list's allergies)
 * are in, via `getRecipeOptions`. One event has at most one meal, so this
 * upserts rather than always creating. Also generates the shared
 * shopping list from the recipe's ingredients, scaled to the number of
 * confirmed eaters (business plan 5.1: "a shared basket ... scaled to
 * the number of eaters", instead of everyone typing it by hand). */
export async function chooseRecipe(pb: PocketBase, eventId: string, recipeId: string): Promise<void> {
  try {
    const existing = await pb.collection("event_meals").getFirstListItem(`event = "${eventId}"`);
    await pb.collection("event_meals").update(existing.id, { recipe: recipeId });
  } catch {
    await pb.collection("event_meals").create({ event: eventId, recipe: recipeId });
  }
  try {
    await generateShoppingListFromRecipe(pb, eventId, recipeId);
  } catch {
    // Non-fatal: the recipe choice itself already succeeded. A group
    // admin without organizer/cook rights on an older event may not have
    // shopping_list_items write access yet (pre-migration-003 data) —
    // the organizer/cook can still add items by hand either way.
  }
}

/** Round a scaled quantity to something a shopping list is actually
 * useful with: whole units for "stuk"/"teentje"/etc, one decimal for
 * weights/volumes that are commonly fractional. */
function roundScaledQuantity(quantity: number, unit: RecipeIngredient["unit"]): number {
  const wholeUnits: RecipeIngredient["unit"][] = ["stuk", "teentje", "blik", "pak", "bosje"];
  if (wholeUnits.includes(unit)) return Math.max(1, Math.round(quantity));
  return Math.round(quantity * 10) / 10;
}

async function generateShoppingListFromRecipe(pb: PocketBase, eventId: string, recipeId: string): Promise<void> {
  const [recipe, yesRsvps, existingItems, recipeIngredients] = await Promise.all([
    pb.collection("recipes").getOne<Recipe>(recipeId),
    pb.collection("rsvps").getFullList<Rsvp>({ filter: `event = "${eventId}" && status = "yes"` }),
    pb.collection("shopping_list_items").getFullList({ filter: `event = "${eventId}" && ingredient != ""` }),
    pb.collection("recipe_ingredients").getFullList<RecipeIngredient>({ filter: `recipe = "${recipeId}"` }),
  ]);

  const eaters = yesRsvps.length > 0 ? yesRsvps.length : recipe.servings || 1;
  const scale = recipe.servings > 0 ? eaters / recipe.servings : 1;

  const alreadyListed = new Set((existingItems as { ingredient?: string }[]).map((i) => i.ingredient));
  const toCreate = recipeIngredients.filter((ri) => !alreadyListed.has(ri.ingredient));

  await Promise.all(
    toCreate.map((ri) =>
      pb.collection("shopping_list_items").create({
        event: eventId,
        ingredient: ri.ingredient,
        quantity: roundScaledQuantity(ri.quantity * scale, ri.unit),
        unit: ri.unit,
        checked: false,
      })
    )
  );
}

export async function createEventSeries(
  pb: PocketBase,
  data: {
    organizer: string;
    title: string;
    groupId?: string;
    rruleFreq: "weekly" | "biweekly" | "monthly";
    rruleByweekday: Weekday;
    startTime: string;
    startDate: string;
    endDate?: string;
    cookRotationEnabled: boolean;
    cookRotationOrder: string[];
    surpriseDefault: boolean;
    defaultLocation?: string;
  }
): Promise<EventSeries> {
  return pb.collection("event_series").create<EventSeries>({
    organizer: data.organizer,
    group: data.groupId ?? "",
    title: data.title,
    rrule_freq: data.rruleFreq,
    rrule_byweekday: data.rruleByweekday,
    start_time: data.startTime,
    start_date: data.startDate,
    end_date: data.endDate ?? "",
    cook_rotation_enabled: data.cookRotationEnabled,
    cook_rotation_order: data.cookRotationOrder,
    surprise_default: data.surpriseDefault,
    default_location: data.defaultLocation ?? "",
    active: true,
  });
}
