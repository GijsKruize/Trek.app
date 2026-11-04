import type PocketBase from "pocketbase";
import { nanoid } from "nanoid";
import type {
  Group,
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
  recipe: Recipe | null;
  revealed: boolean;
  shoppingList: ShoppingListItem[];
  myStatus: RsvpStatus;
}

function isMealRevealed(event: TrekEvent): boolean {
  if (!event.is_surprise) return true;
  if (event.revealed_at) return true;
  return new Date(event.starts_at).getTime() <= Date.now();
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

  const myStatus: RsvpStatus = userId
    ? ((attendees.find((a) => a.user === userId)?.status as RsvpStatus) ?? "pending")
    : "pending";

  return { event, attendees, recipe, revealed, shoppingList, myStatus };
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

export async function createLooseEvent(
  pb: PocketBase,
  data: {
    organizer: string;
    title: string;
    startsAt: string;
    location: string;
    isSurprise: boolean;
    recipeId?: string;
  }
): Promise<EventExpanded> {
  const event = await pb.collection("events").create<EventExpanded>({
    organizer: data.organizer,
    group: "",
    title: data.title,
    starts_at: data.startsAt,
    location: data.location,
    is_surprise: data.isSurprise,
    status: "scheduled",
  });

  if (data.recipeId) {
    await pb.collection("event_meals").create({ event: event.id, recipe: data.recipeId });
  }

  return event;
}
