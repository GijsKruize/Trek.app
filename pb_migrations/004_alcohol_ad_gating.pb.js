/// <reference path="../pb_data/types.d.ts" />

// Business plan §6.1/§10 "Responsible advertising": alcohol ads only shown
// to users confirmed 18+. Adds `ads.is_alcohol` (marks which placements
// need gating) and `users.birth_date` (optional — the only way we can
// confirm age; a user who never sets it is treated as not-yet-confirmed,
// not as underage, and simply never sees alcohol ads until they do).

migrate((app) => {
  const ads = app.findCollectionByNameOrId("ads");
  ads.fields.add(new BoolField({ name: "is_alcohol" }));
  app.save(ads);

  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new DateField({ name: "birth_date" }));
  app.save(users);
}, (app) => {
  const ads = app.findCollectionByNameOrId("ads");
  ads.fields.remove("is_alcohol");
  app.save(ads);

  const users = app.findCollectionByNameOrId("users");
  users.fields.remove("birth_date");
  app.save(users);
});
