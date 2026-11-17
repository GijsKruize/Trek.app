/// <reference path="../pb_data/types.d.ts" />

// Widens shopping_list_items create/update to group admins, not just the
// organizer/cook — needed now that RecipePicker (confirmable by any
// canManage user, i.e. organizer OR group admin, see
// src/app/(app)/eten/[eventId]/page.tsx) auto-generates the list from the
// matched recipe's ingredients. Previously a group admin who wasn't also
// the organizer/cook would have the event_meals write succeed but every
// shopping_list_items create silently rejected.

migrate((app) => {
  const shoppingListItems = app.findCollectionByNameOrId("shopping_list_items");
  shoppingListItems.createRule =
    'event.organizer = @request.auth.id || event.cook = @request.auth.id || (event.group != "" && event.group.admins ?= @request.auth.id)';
  shoppingListItems.updateRule =
    'event.organizer = @request.auth.id || event.cook = @request.auth.id || (event.group != "" && event.group.admins ?= @request.auth.id)';
  app.save(shoppingListItems);
}, (app) => {
  const shoppingListItems = app.findCollectionByNameOrId("shopping_list_items");
  shoppingListItems.createRule = "event.organizer = @request.auth.id || event.cook = @request.auth.id";
  shoppingListItems.updateRule = "event.organizer = @request.auth.id || event.cook = @request.auth.id";
  app.save(shoppingListItems);
});
