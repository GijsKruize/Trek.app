/// <reference path="../pb_data/types.d.ts" />

// Trek? initial schema. Mirrors docs/schema.md — keep both in sync.
//
// Collections are created in dependency order so relation fields can
// reference an already-saved collection's id. Fields are added via
// `collection.fields.add(...)` (not the Collection constructor's `fields`
// option) — on this PocketBase build, fields passed through the
// constructor aren't indexed in time for same-call rule validation to see
// them ("unknown field" errors), while `.fields.add()` is.

const DIET_TAGS = [
  "vegetarisch",
  "vegan",
  "glutenvrij",
  "lactosevrij",
  "halal",
  "kosjer",
  "pescotarisch",
];

const INGREDIENT_TAGS = [
  "noten",
  "pinda",
  "zuivel",
  "lactose",
  "gluten",
  "ei",
  "vis",
  "schaaldieren",
  "soja",
  "vlees",
  "varkensvlees",
  "rundvlees",
  "pluimvee",
  "peulvruchten",
  "alcohol",
  "honing",
];

const UNITS = [
  "gram",
  "kilogram",
  "ml",
  "liter",
  "stuk",
  "el",
  "tl",
  "snufje",
  "teentje",
  "bosje",
  "blik",
  "pak",
];

migrate((app) => {
  // ---------------------------------------------------------------------
  // ingredients
  // ---------------------------------------------------------------------
  const ingredients = new Collection({ type: "base", name: "ingredients" });
  ingredients.fields.add(new TextField({ name: "name", required: true, max: 200 }));
  ingredients.fields.add(new SelectField({ name: "tags", maxSelect: INGREDIENT_TAGS.length, values: INGREDIENT_TAGS }));
  ingredients.fields.add(new SelectField({ name: "unit_default", maxSelect: 1, values: UNITS }));
  ingredients.indexes = ["CREATE INDEX idx_ingredients_name ON ingredients (name)"];
  ingredients.listRule = "";
  ingredients.viewRule = "";
  ingredients.createRule = null;
  ingredients.updateRule = null;
  ingredients.deleteRule = null;
  ingredients.fields.add(new AutodateField({ name: "created", onCreate: true }));
  ingredients.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(ingredients);

  // ---------------------------------------------------------------------
  // recipes
  // ---------------------------------------------------------------------
  const recipes = new Collection({ type: "base", name: "recipes" });
  recipes.fields.add(new TextField({ name: "title", required: true, max: 200 }));
  recipes.fields.add(new TextField({ name: "description", max: 2000 }));
  recipes.fields.add(
    new FileField({ name: "image", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/png", "image/jpeg", "image/webp"] })
  );
  recipes.fields.add(new NumberField({ name: "servings", onlyInt: true, min: 1 }));
  recipes.fields.add(new TextField({ name: "instructions", required: true, max: 10000 }));
  recipes.fields.add(new NumberField({ name: "prep_minutes", onlyInt: true, min: 0 }));
  recipes.fields.add(new BoolField({ name: "is_published" }));
  recipes.listRule = "is_published = true";
  recipes.viewRule = "is_published = true";
  recipes.createRule = null;
  recipes.updateRule = null;
  recipes.deleteRule = null;
  recipes.fields.add(new AutodateField({ name: "created", onCreate: true }));
  recipes.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(recipes);

  // ---------------------------------------------------------------------
  // recipe_ingredients
  // ---------------------------------------------------------------------
  const recipeIngredients = new Collection({ type: "base", name: "recipe_ingredients" });
  recipeIngredients.fields.add(
    new RelationField({ name: "recipe", required: true, maxSelect: 1, collectionId: recipes.id, cascadeDelete: true })
  );
  recipeIngredients.fields.add(
    new RelationField({ name: "ingredient", required: true, maxSelect: 1, collectionId: ingredients.id, cascadeDelete: false })
  );
  recipeIngredients.fields.add(new NumberField({ name: "quantity", required: true, min: 0 }));
  recipeIngredients.fields.add(new SelectField({ name: "unit", required: true, maxSelect: 1, values: UNITS }));
  recipeIngredients.fields.add(new TextField({ name: "note", max: 200 }));
  recipeIngredients.fields.add(new NumberField({ name: "sort_order", onlyInt: true }));
  recipeIngredients.indexes = ["CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients (recipe)"];
  recipeIngredients.listRule = "recipe.is_published = true";
  recipeIngredients.viewRule = "recipe.is_published = true";
  recipeIngredients.createRule = null;
  recipeIngredients.updateRule = null;
  recipeIngredients.deleteRule = null;
  recipeIngredients.fields.add(new AutodateField({ name: "created", onCreate: true }));
  recipeIngredients.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(recipeIngredients);

  // ---------------------------------------------------------------------
  // users (extend the built-in auth collection)
  // ---------------------------------------------------------------------
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new TextField({ name: "name", required: true, max: 120 }));
  users.fields.add(
    new FileField({ name: "avatar", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/png", "image/jpeg", "image/webp"] })
  );
  users.fields.add(new SelectField({ name: "diet_tags", maxSelect: DIET_TAGS.length, values: DIET_TAGS }));
  users.fields.add(
    new RelationField({ name: "allergy_ingredients", maxSelect: 999, collectionId: ingredients.id, cascadeDelete: false })
  );
  users.listRule = '@request.auth.id != ""';
  users.viewRule = '@request.auth.id != ""';
  users.createRule = "";
  users.updateRule = "id = @request.auth.id";
  users.deleteRule = "id = @request.auth.id";
  app.save(users);

  // ---------------------------------------------------------------------
  // groups
  // ---------------------------------------------------------------------
  const groups = new Collection({ type: "base", name: "groups" });
  groups.fields.add(new TextField({ name: "name", required: true, max: 120 }));
  groups.fields.add(new TextField({ name: "address", max: 300 }));
  groups.fields.add(
    new FileField({ name: "image", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/png", "image/jpeg", "image/webp"] })
  );
  groups.fields.add(new RelationField({ name: "admins", maxSelect: 999, collectionId: users.id, cascadeDelete: false }));
  // listRule/viewRule reference the group_members_via_group back-relation,
  // which can't resolve until the group_members collection exists below —
  // save with the (already valid) admin-only rules for now and tighten
  // list/view once group_members has been created.
  groups.createRule = '@request.auth.id != ""';
  groups.updateRule = "admins ?= @request.auth.id";
  groups.deleteRule = "admins ?= @request.auth.id";
  groups.fields.add(new AutodateField({ name: "created", onCreate: true }));
  groups.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(groups);

  // ---------------------------------------------------------------------
  // group_members
  // ---------------------------------------------------------------------
  const groupMembers = new Collection({ type: "base", name: "group_members" });
  groupMembers.fields.add(
    new RelationField({ name: "group", required: true, maxSelect: 1, collectionId: groups.id, cascadeDelete: true })
  );
  groupMembers.fields.add(
    new RelationField({ name: "user", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true })
  );
  groupMembers.fields.add(new SelectField({ name: "role", required: true, maxSelect: 1, values: ["admin", "member"] }));
  groupMembers.indexes = ["CREATE UNIQUE INDEX idx_group_members_unique ON group_members (`group`, user)"];
  groupMembers.listRule = "group.group_members_via_group.user ?= @request.auth.id";
  groupMembers.viewRule = "group.group_members_via_group.user ?= @request.auth.id";
  groupMembers.createRule = "group.admins ?= @request.auth.id";
  groupMembers.updateRule = "group.admins ?= @request.auth.id";
  groupMembers.deleteRule = "user = @request.auth.id || group.admins ?= @request.auth.id";
  groupMembers.fields.add(new AutodateField({ name: "created", onCreate: true }));
  groupMembers.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(groupMembers);

  // group_members now exists, so groups' back-relation rules can resolve.
  groups.listRule = "group_members_via_group.user ?= @request.auth.id";
  groups.viewRule = "group_members_via_group.user ?= @request.auth.id";
  app.save(groups);

  // ---------------------------------------------------------------------
  // group_invites
  // ---------------------------------------------------------------------
  const groupInvites = new Collection({ type: "base", name: "group_invites" });
  groupInvites.fields.add(
    new RelationField({ name: "group", required: true, maxSelect: 1, collectionId: groups.id, cascadeDelete: true })
  );
  groupInvites.fields.add(new TextField({ name: "code", required: true, max: 40 }));
  groupInvites.fields.add(
    new RelationField({ name: "created_by", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false })
  );
  groupInvites.fields.add(new NumberField({ name: "max_uses", onlyInt: true, min: 1 }));
  groupInvites.fields.add(new NumberField({ name: "uses_count", onlyInt: true, min: 0 }));
  groupInvites.fields.add(new DateField({ name: "expires_at" }));
  groupInvites.fields.add(new BoolField({ name: "revoked" }));
  groupInvites.indexes = ["CREATE UNIQUE INDEX idx_group_invites_code ON group_invites (code)"];
  groupInvites.listRule = "group.admins ?= @request.auth.id";
  groupInvites.viewRule = "group.admins ?= @request.auth.id";
  groupInvites.createRule = "group.admins ?= @request.auth.id";
  groupInvites.updateRule = "group.admins ?= @request.auth.id";
  groupInvites.deleteRule = "group.admins ?= @request.auth.id";
  groupInvites.fields.add(new AutodateField({ name: "created", onCreate: true }));
  groupInvites.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(groupInvites);

  // ---------------------------------------------------------------------
  // ads
  // ---------------------------------------------------------------------
  const ads = new Collection({ type: "base", name: "ads" });
  ads.fields.add(new TextField({ name: "title", required: true, max: 160 }));
  ads.fields.add(new TextField({ name: "teaser", max: 300 }));
  ads.fields.add(
    // Not required: food/ad imagery is an illustrated placeholder until
    // real photos exist (see brandbook) — cards fall back to an icon.
    new FileField({ name: "image", maxSelect: 1, maxSize: 5242880, mimeTypes: ["image/png", "image/jpeg", "image/webp"] })
  );
  ads.fields.add(new TextField({ name: "link_url", required: true, max: 500 }));
  ads.fields.add(new BoolField({ name: "active" }));
  ads.fields.add(new DateField({ name: "starts_at" }));
  ads.fields.add(new DateField({ name: "ends_at" }));
  ads.fields.add(new NumberField({ name: "sort_weight", onlyInt: true }));
  ads.listRule = "active = true";
  ads.viewRule = "active = true";
  ads.createRule = null;
  ads.updateRule = null;
  ads.deleteRule = null;
  ads.fields.add(new AutodateField({ name: "created", onCreate: true }));
  ads.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(ads);

  // ---------------------------------------------------------------------
  // event_series (recurring definition)
  // ---------------------------------------------------------------------
  const eventSeries = new Collection({ type: "base", name: "event_series" });
  eventSeries.fields.add(new RelationField({ name: "group", maxSelect: 1, collectionId: groups.id, cascadeDelete: true }));
  eventSeries.fields.add(
    new RelationField({ name: "organizer", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false })
  );
  eventSeries.fields.add(new TextField({ name: "title", required: true, max: 160 }));
  eventSeries.fields.add(new RelationField({ name: "default_recipe", maxSelect: 1, collectionId: recipes.id, cascadeDelete: false }));
  eventSeries.fields.add(new TextField({ name: "default_location", max: 300 }));
  eventSeries.fields.add(new SelectField({ name: "rrule_freq", required: true, maxSelect: 1, values: ["weekly", "biweekly", "monthly"] }));
  eventSeries.fields.add(
    new SelectField({
      name: "rrule_byweekday",
      required: true,
      maxSelect: 1,
      values: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    })
  );
  eventSeries.fields.add(new TextField({ name: "start_time", required: true, max: 5, pattern: "^[0-2][0-9]:[0-5][0-9]$" }));
  eventSeries.fields.add(new DateField({ name: "start_date", required: true }));
  eventSeries.fields.add(new DateField({ name: "end_date" }));
  eventSeries.fields.add(new BoolField({ name: "cook_rotation_enabled" }));
  eventSeries.fields.add(new JSONField({ name: "cook_rotation_order", maxSize: 2000 }));
  eventSeries.fields.add(new NumberField({ name: "cook_rotation_pointer", onlyInt: true, min: 0 }));
  eventSeries.fields.add(new BoolField({ name: "surprise_default" }));
  eventSeries.fields.add(new BoolField({ name: "active" }));
  eventSeries.listRule = 'organizer = @request.auth.id || (group != "" && group.group_members_via_group.user ?= @request.auth.id)';
  eventSeries.viewRule = 'organizer = @request.auth.id || (group != "" && group.group_members_via_group.user ?= @request.auth.id)';
  eventSeries.createRule = '@request.auth.id != "" && (group = "" || group.group_members_via_group.user ?= @request.auth.id)';
  eventSeries.updateRule = 'organizer = @request.auth.id || (group != "" && group.admins ?= @request.auth.id)';
  eventSeries.deleteRule = 'organizer = @request.auth.id || (group != "" && group.admins ?= @request.auth.id)';
  eventSeries.fields.add(new AutodateField({ name: "created", onCreate: true }));
  eventSeries.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(eventSeries);

  // ---------------------------------------------------------------------
  // events (every occurrence: loose/group x one-off/generated)
  // ---------------------------------------------------------------------
  const events = new Collection({ type: "base", name: "events" });
  events.fields.add(new RelationField({ name: "series", maxSelect: 1, collectionId: eventSeries.id, cascadeDelete: false }));
  events.fields.add(new RelationField({ name: "group", maxSelect: 1, collectionId: groups.id, cascadeDelete: true }));
  events.fields.add(
    new RelationField({ name: "organizer", required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false })
  );
  events.fields.add(new RelationField({ name: "invitees", maxSelect: 999, collectionId: users.id, cascadeDelete: false }));
  events.fields.add(new TextField({ name: "title", max: 160 }));
  events.fields.add(new DateField({ name: "starts_at", required: true }));
  events.fields.add(new TextField({ name: "location", max: 300 }));
  events.fields.add(new RelationField({ name: "cook", maxSelect: 1, collectionId: users.id, cascadeDelete: false }));
  events.fields.add(new BoolField({ name: "is_surprise" }));
  events.fields.add(new DateField({ name: "revealed_at" }));
  events.fields.add(new NumberField({ name: "total_cost_cents", onlyInt: true, min: 0 }));
  events.fields.add(new SelectField({ name: "status", required: true, maxSelect: 1, values: ["scheduled", "cancelled"] }));
  events.fields.add(new TextField({ name: "share_token", max: 40 }));
  events.indexes = [
    "CREATE INDEX idx_events_starts_at ON events (starts_at)",
    "CREATE UNIQUE INDEX idx_events_share_token ON events (share_token) WHERE share_token != ''",
  ];
  events.listRule =
    'organizer = @request.auth.id || cook = @request.auth.id || invitees ?= @request.auth.id || (group != "" && group.group_members_via_group.user ?= @request.auth.id)';
  events.viewRule =
    'organizer = @request.auth.id || cook = @request.auth.id || invitees ?= @request.auth.id || (group != "" && group.group_members_via_group.user ?= @request.auth.id)';
  events.createRule =
    '@request.auth.id != "" && @request.body.organizer = @request.auth.id && (@request.body.group = "" || @request.body.group.group_members_via_group.user ?= @request.auth.id)';
  events.updateRule = 'organizer = @request.auth.id || cook = @request.auth.id || (group != "" && group.admins ?= @request.auth.id)';
  events.deleteRule = 'organizer = @request.auth.id || (group != "" && group.admins ?= @request.auth.id)';
  events.fields.add(new AutodateField({ name: "created", onCreate: true }));
  events.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(events);

  // ---------------------------------------------------------------------
  // event_meals (surprise-gated recipe link — see docs/schema.md)
  // ---------------------------------------------------------------------
  const eventMeals = new Collection({ type: "base", name: "event_meals" });
  eventMeals.fields.add(new RelationField({ name: "event", required: true, maxSelect: 1, collectionId: events.id, cascadeDelete: true }));
  eventMeals.fields.add(new RelationField({ name: "recipe", maxSelect: 1, collectionId: recipes.id, cascadeDelete: false }));
  eventMeals.indexes = ["CREATE UNIQUE INDEX idx_event_meals_event ON event_meals (event)"];
  eventMeals.listRule =
    'event.is_surprise = false || event.revealed_at != "" || event.starts_at <= @now || event.cook = @request.auth.id || event.organizer = @request.auth.id';
  eventMeals.viewRule =
    'event.is_surprise = false || event.revealed_at != "" || event.starts_at <= @now || event.cook = @request.auth.id || event.organizer = @request.auth.id';
  eventMeals.createRule = 'event.organizer = @request.auth.id || (event.group != "" && event.group.admins ?= @request.auth.id)';
  eventMeals.updateRule = 'event.organizer = @request.auth.id || (event.group != "" && event.group.admins ?= @request.auth.id)';
  eventMeals.deleteRule = 'event.organizer = @request.auth.id || (event.group != "" && event.group.admins ?= @request.auth.id)';
  eventMeals.fields.add(new AutodateField({ name: "created", onCreate: true }));
  eventMeals.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(eventMeals);

  // ---------------------------------------------------------------------
  // shopping_list_items
  // ---------------------------------------------------------------------
  const shoppingListItems = new Collection({ type: "base", name: "shopping_list_items" });
  shoppingListItems.fields.add(
    new RelationField({ name: "event", required: true, maxSelect: 1, collectionId: events.id, cascadeDelete: true })
  );
  shoppingListItems.fields.add(new RelationField({ name: "ingredient", maxSelect: 1, collectionId: ingredients.id, cascadeDelete: false }));
  shoppingListItems.fields.add(new TextField({ name: "custom_label", max: 200 }));
  shoppingListItems.fields.add(new NumberField({ name: "quantity", min: 0 }));
  shoppingListItems.fields.add(new SelectField({ name: "unit", maxSelect: 1, values: UNITS }));
  shoppingListItems.fields.add(new BoolField({ name: "checked" }));
  shoppingListItems.fields.add(new RelationField({ name: "added_by", maxSelect: 1, collectionId: users.id, cascadeDelete: false }));
  shoppingListItems.indexes = ["CREATE INDEX idx_shopping_list_items_event ON shopping_list_items (event)"];
  shoppingListItems.listRule =
    'event.cook = @request.auth.id || event.organizer = @request.auth.id || ((event.is_surprise = false || event.revealed_at != "" || event.starts_at <= @now) && (event.invitees ?= @request.auth.id || (event.group != "" && event.group.group_members_via_group.user ?= @request.auth.id)))';
  shoppingListItems.viewRule =
    'event.cook = @request.auth.id || event.organizer = @request.auth.id || ((event.is_surprise = false || event.revealed_at != "" || event.starts_at <= @now) && (event.invitees ?= @request.auth.id || (event.group != "" && event.group.group_members_via_group.user ?= @request.auth.id)))';
  shoppingListItems.createRule = "event.organizer = @request.auth.id || event.cook = @request.auth.id";
  shoppingListItems.updateRule = "event.organizer = @request.auth.id || event.cook = @request.auth.id";
  shoppingListItems.deleteRule = "event.organizer = @request.auth.id || event.cook = @request.auth.id";
  shoppingListItems.fields.add(new AutodateField({ name: "created", onCreate: true }));
  shoppingListItems.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(shoppingListItems);

  // ---------------------------------------------------------------------
  // rsvps (member + guest)
  // ---------------------------------------------------------------------
  const rsvps = new Collection({ type: "base", name: "rsvps" });
  rsvps.fields.add(new RelationField({ name: "event", required: true, maxSelect: 1, collectionId: events.id, cascadeDelete: true }));
  rsvps.fields.add(new RelationField({ name: "user", maxSelect: 1, collectionId: users.id, cascadeDelete: true }));
  rsvps.fields.add(new TextField({ name: "guest_name", max: 80 }));
  rsvps.fields.add(new SelectField({ name: "status", required: true, maxSelect: 1, values: ["yes", "no"] }));
  rsvps.indexes = [
    "CREATE INDEX idx_rsvps_event ON rsvps (event)",
    "CREATE UNIQUE INDEX idx_rsvps_event_user_unique ON rsvps (event, user) WHERE user != ''",
  ];
  rsvps.listRule =
    'user = @request.auth.id || event.organizer = @request.auth.id || event.cook = @request.auth.id || event.invitees ?= @request.auth.id || (event.group != "" && event.group.group_members_via_group.user ?= @request.auth.id)';
  rsvps.viewRule =
    'user = @request.auth.id || event.organizer = @request.auth.id || event.cook = @request.auth.id || event.invitees ?= @request.auth.id || (event.group != "" && event.group.group_members_via_group.user ?= @request.auth.id)';
  rsvps.createRule =
    '@request.auth.id != "" && @request.body.user = @request.auth.id && (event.organizer = @request.auth.id || event.invitees ?= @request.auth.id || (event.group != "" && event.group.group_members_via_group.user ?= @request.auth.id))';
  rsvps.updateRule = "user = @request.auth.id";
  rsvps.deleteRule = 'user = @request.auth.id || event.organizer = @request.auth.id || (event.group != "" && event.group.admins ?= @request.auth.id)';
  rsvps.fields.add(new AutodateField({ name: "created", onCreate: true }));
  rsvps.fields.add(new AutodateField({ name: "updated", onCreate: true, onUpdate: true }));
  app.save(rsvps);
}, (app) => {
  // down: drop in reverse dependency order
  const names = [
    "rsvps",
    "shopping_list_items",
    "event_meals",
    "events",
    "event_series",
    "ads",
    "group_invites",
    "group_members",
    "groups",
    "recipe_ingredients",
    "recipes",
    "ingredients",
  ];
  for (const name of names) {
    const collection = app.findCollectionByNameOrId(name);
    if (collection) app.delete(collection);
  }

  const users = app.findCollectionByNameOrId("users");
  for (const name of ["name", "avatar", "diet_tags", "allergy_ingredients"]) {
    users.fields.remove(name);
  }
  users.listRule = null;
  users.viewRule = null;
  users.createRule = null;
  users.updateRule = "id = @request.auth.id";
  users.deleteRule = "id = @request.auth.id";
  app.save(users);
});
