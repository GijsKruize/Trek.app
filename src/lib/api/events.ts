import type PocketBase from "pocketbase";
import { nanoid } from "nanoid";
import type {
  Group,
  GroupMember,
  Recipe,
  Rsvp,
  ShoppingListItem,
  TrekEvent,
  TrekUser,
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
  shoppingList: ShoppingListItem[];
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

  let shoppingList: ShoppingListItem[] = [];
  try {
    shoppingList = await pb.collection("shopping_list_items").getFullList<ShoppingListItem>({
      filter: `event = "${eventId}"`,
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
 * upserts rather than always creating. */
export async function chooseRecipe(pb: PocketBase, eventId: string, recipeId: string): Promise<void> {
  try {
    const existing = await pb.collection("event_meals").getFirstListItem(`event = "${eventId}"`);
    await pb.collection("event_meals").update(existing.id, { recipe: recipeId });
  } catch {
    await pb.collection("event_meals").create({ event: eventId, recipe: recipeId });
  }
}
