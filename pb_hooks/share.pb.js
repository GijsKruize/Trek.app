/// <reference path="../pb_data/types.d.ts" />

// The entire public, unauthenticated attack surface lives in these two
// routes. Everything else (events.listRule/viewRule, rsvps.createRule) stays
// strictly member-scoped — see docs/schema.md "Public sharing".

routerAdd("GET", "/api/trek/share/{token}", (e) => {
  const shared = require(`${__hooks}/shared.js`);
  const token = e.request.pathValue("token");
  if (!token) {
    throw new NotFoundError("Niet gevonden.");
  }

  const event = shared.tryFindFirst(e.app, "events", "share_token = {:token}", { token: token });
  if (!event || event.get("status") === "cancelled") {
    throw new NotFoundError("Dit etentje is niet (meer) beschikbaar.");
  }

  const organizer = e.app.findRecordById("users", event.get("organizer"));
  const cookId = event.get("cook");
  const cook = cookId ? e.app.findRecordById("users", cookId) : null;

  let groupAddress = "";
  const groupId = event.get("group");
  if (groupId) {
    const group = e.app.findRecordById("groups", groupId);
    groupAddress = group ? group.get("address") : "";
  }

  const revealed = shared.isMealRevealed(event);
  let recipe = null;
  if (revealed) {
    const meal = shared.tryFindFirst(e.app, "event_meals", "event = {:event}", { event: event.id });
    if (meal && meal.get("recipe")) {
      const recipeRecord = e.app.findRecordById("recipes", meal.get("recipe"));
      if (recipeRecord) {
        recipe = {
          recipeId: recipeRecord.id,
          title: recipeRecord.get("title"),
          description: recipeRecord.get("description"),
          image: recipeRecord.get("image") || "",
        };
      }
    }
  }

  const rsvpRows = e.app.findRecordsByFilter("rsvps", "event = {:event}", "", 500, 0, { event: event.id });
  let yesCount = 0;
  let noCount = 0;
  for (const rsvp of rsvpRows) {
    if (rsvp.get("status") === "yes") {
      yesCount++;
    } else {
      noCount++;
    }
  }

  return e.json(200, {
    title: event.get("title") || (recipe ? recipe.title : "Etentje"),
    startsAt: event.get("starts_at"),
    location: event.get("location") || groupAddress,
    organizerName: organizer ? organizer.get("name") : "",
    organizerPhone: organizer ? organizer.get("phone") : "",
    organizerEmail: organizer ? organizer.get("email") : "",
    cookName: cook ? cook.get("name") : "",
    isSurprise: event.get("is_surprise"),
    revealed: revealed,
    recipe: recipe,
    rsvpSummary: { yes: yesCount, no: noCount },
    rsvpLocked: shared.isRsvpLocked(event),
  });
});

routerAdd("POST", "/api/trek/share/{token}/rsvp", (e) => {
  const shared = require(`${__hooks}/shared.js`);
  const token = e.request.pathValue("token");
  const event = token ? shared.tryFindFirst(e.app, "events", "share_token = {:token}", { token: token }) : null;
  if (!event || event.get("status") === "cancelled") {
    throw new NotFoundError("Dit etentje is niet (meer) beschikbaar.");
  }
  if (shared.isRsvpLocked(event)) {
    throw new ForbiddenError("RSVP's zijn gesloten voor dit etentje. Neem rechtstreeks contact op met de organisator.");
  }

  const data = new DynamicModel({ name: "", status: "" });
  e.bindBody(data);
  const name = (data.name || "").trim();
  const status = data.status;

  if (!name) {
    throw new BadRequestError("Vul je naam in.");
  }
  if (status !== "yes" && status !== "no") {
    throw new BadRequestError("status moet yes of no zijn.");
  }

  const rsvpsCollection = e.app.findCollectionByNameOrId("rsvps");
  const rsvp = new Record(rsvpsCollection);
  rsvp.set("event", event.id);
  rsvp.set("guest_name", name);
  rsvp.set("status", status);
  e.app.save(rsvp);

  return e.json(200, { ok: true });
});
