/**
 * Demo/seed script — run via `npm run db:seed` against a running local
 * PocketBase instance. Uses the SDK as an authenticated superuser client
 * (not pb_migrations): this is resettable demo content, not schema.
 *
 * The recurring series is created through the normal API (not hand-built)
 * so the real `series.pb.js` hook generates its occurrences exactly as
 * production would.
 */
import PocketBase from "pocketbase";

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "http://127.0.0.1:8090";
const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL ?? "admin@trek.app";
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD ?? "TrekAdmin123!";

const pb = new PocketBase(POCKETBASE_URL);

async function main() {
  await pb.collection("_superusers").authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASSWORD);
  console.log(`Ingelogd op ${POCKETBASE_URL}.`);

  // ---------------------------------------------------------------------
  // Ingredients
  // ---------------------------------------------------------------------
  const ingredientDefs: Array<{ name: string; tags: string[] }> = [
    { name: "Pinda's", tags: ["pinda", "noten"] },
    { name: "Amandelen", tags: ["noten"] },
    { name: "Volle melk", tags: ["zuivel", "lactose"] },
    { name: "Boter", tags: ["zuivel", "lactose"] },
    { name: "Parmezaanse kaas", tags: ["zuivel", "lactose"] },
    { name: "Tarweblock bloem", tags: ["gluten"] },
    { name: "Spaghetti", tags: ["gluten"] },
    { name: "Ei", tags: ["ei"] },
    { name: "Kipfilet", tags: ["vlees", "pluimvee"] },
    { name: "Spekreepjes", tags: ["vlees", "varkensvlees"] },
    { name: "Rundergehakt", tags: ["vlees", "rundvlees"] },
    { name: "Zalmfilet", tags: ["vis"] },
    { name: "Garnalen", tags: ["schaaldieren"] },
    { name: "Sojasaus", tags: ["soja", "gluten"] },
    { name: "Tofu", tags: ["soja"] },
    { name: "Kikkererwten", tags: ["peulvruchten"] },
    { name: "Linzen", tags: ["peulvruchten"] },
    { name: "Witte wijn", tags: ["alcohol"] },
    { name: "Honing", tags: ["honing"] },
    { name: "Ui", tags: [] },
    { name: "Knoflook", tags: [] },
    { name: "Tomaat", tags: [] },
    { name: "Courgette", tags: [] },
    { name: "Paprika", tags: [] },
    { name: "Basmatirijst", tags: [] },
    { name: "Kokosmelk", tags: [] },
    { name: "Currypasta", tags: [] },
    { name: "Broccoli", tags: [] },
  ];

  const ingredientIds: Record<string, string> = {};
  for (const def of ingredientDefs) {
    const record = await pb.collection("ingredients").create({ name: def.name, tags: def.tags });
    ingredientIds[def.name] = record.id;
  }
  console.log(`${ingredientDefs.length} ingrediënten aangemaakt.`);

  // ---------------------------------------------------------------------
  // Recipes
  // ---------------------------------------------------------------------
  const recipeDefs: Array<{
    title: string;
    description: string;
    servings: number;
    prep_minutes: number;
    instructions: string;
    ingredients: Array<{ name: string; quantity: number; unit: string; note?: string }>;
  }> = [
    {
      title: "Spaghetti carbonara",
      description: "Romig, snel, en altijd een succes aan tafel.",
      servings: 4,
      prep_minutes: 25,
      instructions: "Kook de spaghetti. Bak de spekreepjes krokant. Mix eieren met parmezaanse kaas. Mix alles samen van het vuur af.",
      ingredients: [
        { name: "Spaghetti", quantity: 400, unit: "gram" },
        { name: "Spekreepjes", quantity: 200, unit: "gram" },
        { name: "Ei", quantity: 3, unit: "stuk" },
        { name: "Parmezaanse kaas", quantity: 80, unit: "gram" },
      ],
    },
    {
      title: "Groene curry met kip",
      description: "Pittig, romig en klaar in een pan.",
      servings: 4,
      prep_minutes: 30,
      instructions: "Bak de kip aan. Voeg currypasta en kokosmelk toe. Groenten erbij en laten sudderen. Serveer met rijst.",
      ingredients: [
        { name: "Kipfilet", quantity: 500, unit: "gram" },
        { name: "Kokosmelk", quantity: 400, unit: "ml" },
        { name: "Currypasta", quantity: 2, unit: "el" },
        { name: "Broccoli", quantity: 1, unit: "stuk" },
        { name: "Basmatirijst", quantity: 300, unit: "gram" },
      ],
    },
    {
      title: "Linzensoep",
      description: "Stevige, vegan maaltijdsoep voor koude avonden.",
      servings: 4,
      prep_minutes: 35,
      instructions: "Fruit ui en knoflook. Linzen, tomaat en bouillon toevoegen. 25 minuten laten koken. Pureren naar smaak.",
      ingredients: [
        { name: "Linzen", quantity: 250, unit: "gram" },
        { name: "Ui", quantity: 1, unit: "stuk" },
        { name: "Knoflook", quantity: 2, unit: "teentje" },
        { name: "Tomaat", quantity: 4, unit: "stuk" },
      ],
    },
    {
      title: "Zalm met broccoli",
      description: "Licht, snel, en vol smaak.",
      servings: 4,
      prep_minutes: 25,
      instructions: "Oven voorverwarmen op 200°C. Zalm en broccoli 15 minuten in de oven. Op smaak met citroen.",
      ingredients: [
        { name: "Zalmfilet", quantity: 4, unit: "stuk" },
        { name: "Broccoli", quantity: 2, unit: "stuk" },
      ],
    },
    {
      title: "Pad thai met garnalen",
      description: "Zoet, zuur en een beetje pittig.",
      servings: 4,
      prep_minutes: 30,
      instructions: "Noedels weken. Garnalen en groenten bakken. Sojasaus erbij. Noedels toevoegen en wokken.",
      ingredients: [
        { name: "Garnalen", quantity: 300, unit: "gram" },
        { name: "Sojasaus", quantity: 3, unit: "el" },
        { name: "Paprika", quantity: 1, unit: "stuk" },
        { name: "Pinda's", quantity: 50, unit: "gram", note: "gehakt, als garnering" },
      ],
    },
    {
      title: "Kikkererwtencurry",
      description: "Vegan, romig en het hele huis blij.",
      servings: 4,
      prep_minutes: 30,
      instructions: "Ui en knoflook fruiten. Kikkererwten, tomaat en kokosmelk toevoegen. 20 minuten laten sudderen.",
      ingredients: [
        { name: "Kikkererwten", quantity: 400, unit: "gram" },
        { name: "Kokosmelk", quantity: 400, unit: "ml" },
        { name: "Tomaat", quantity: 3, unit: "stuk" },
      ],
    },
    {
      title: "Gehaktballen met jus",
      description: "Klassiek huisgemaakt comfort food.",
      servings: 4,
      prep_minutes: 40,
      instructions: "Gehaktballen vormen en braden. Jus trekken van het bakvet. 15 minuten laten garen in de jus.",
      ingredients: [
        { name: "Rundergehakt", quantity: 500, unit: "gram" },
        { name: "Ui", quantity: 1, unit: "stuk" },
        { name: "Ei", quantity: 1, unit: "stuk" },
      ],
    },
    {
      title: "Courgette-pasta pesto",
      description: "Lichte doordeweekse klassieker.",
      servings: 4,
      prep_minutes: 20,
      instructions: "Pasta koken. Courgette kort meebakken. Mengen met pesto en parmezaanse kaas.",
      ingredients: [
        { name: "Spaghetti", quantity: 350, unit: "gram" },
        { name: "Courgette", quantity: 2, unit: "stuk" },
        { name: "Parmezaanse kaas", quantity: 50, unit: "gram" },
      ],
    },
    {
      title: "Tofu wokschotel",
      description: "Snel, vegan en vol groenten.",
      servings: 4,
      prep_minutes: 25,
      instructions: "Tofu krokant bakken. Groenten wokken. Sojasaus en knoflook erbij.",
      ingredients: [
        { name: "Tofu", quantity: 400, unit: "gram" },
        { name: "Sojasaus", quantity: 2, unit: "el" },
        { name: "Paprika", quantity: 1, unit: "stuk" },
        { name: "Knoflook", quantity: 2, unit: "teentje" },
      ],
    },
    {
      title: "Pannenkoeken",
      description: "Voor als het weekend voelt als een excuus.",
      servings: 4,
      prep_minutes: 20,
      instructions: "Beslag mixen van bloem, melk en ei. Dun uitbakken in de pan. Serveren met stroop of honing.",
      ingredients: [
        { name: "Tarweblock bloem", quantity: 250, unit: "gram" },
        { name: "Volle melk", quantity: 500, unit: "ml" },
        { name: "Ei", quantity: 2, unit: "stuk" },
        { name: "Honing", quantity: 2, unit: "el" },
        { name: "Amandelen", quantity: 30, unit: "gram", note: "geschaafd, als garnering" },
      ],
    },
  ];

  const recipeIds: Record<string, string> = {};
  for (const def of recipeDefs) {
    const recipe = await pb.collection("recipes").create({
      title: def.title,
      description: def.description,
      servings: def.servings,
      prep_minutes: def.prep_minutes,
      instructions: def.instructions,
      is_published: true,
    });
    recipeIds[def.title] = recipe.id;

    let sortOrder = 0;
    for (const ri of def.ingredients) {
      await pb.collection("recipe_ingredients").create({
        recipe: recipe.id,
        ingredient: ingredientIds[ri.name],
        quantity: ri.quantity,
        unit: ri.unit,
        note: ri.note ?? "",
        sort_order: sortOrder++,
      });
    }
  }
  console.log(`${recipeDefs.length} recepten aangemaakt.`);

  // ---------------------------------------------------------------------
  // Ads
  // ---------------------------------------------------------------------
  await pb.collection("ads").create({
    title: "Verse kaas van de boerderij",
    teaser: "10% korting voor studentenhuizen — vraag naar de Trek?-deal.",
    link_url: "https://example.com",
    active: true,
    sort_weight: 10,
  });
  await pb.collection("ads").create({
    title: "Wekelijkse boodschappenbox",
    teaser: "Verse ingrediënten, geen gedoe. Eerste box gratis.",
    link_url: "https://example.com",
    active: true,
    sort_weight: 5,
  });
  console.log("2 advertenties aangemaakt.");

  // ---------------------------------------------------------------------
  // Demo users
  // ---------------------------------------------------------------------
  const userDefs = [
    { email: "sanne@trek.app", name: "Sanne", diet_tags: ["vegetarisch"], allergies: [] as string[] },
    { email: "tom@trek.app", name: "Tom", diet_tags: [], allergies: ["Pinda's"] },
    { email: "ahmed@trek.app", name: "Ahmed", diet_tags: ["halal"], allergies: [] },
    { email: "femke@trek.app", name: "Femke", diet_tags: ["lactosevrij"], allergies: ["Amandelen"] },
  ];
  const DEMO_PASSWORD = "Wachtwoord123!";

  const userIds: Record<string, string> = {};
  for (const def of userDefs) {
    const user = await pb.collection("users").create({
      email: def.email,
      password: DEMO_PASSWORD,
      passwordConfirm: DEMO_PASSWORD,
      name: def.name,
      diet_tags: def.diet_tags,
      allergy_ingredients: def.allergies.map((name) => ingredientIds[name]),
    });
    userIds[def.name] = user.id;
  }
  console.log(`${userDefs.length} demogebruikers aangemaakt (wachtwoord: ${DEMO_PASSWORD}).`);

  // ---------------------------------------------------------------------
  // Group — create as Sanne so the group_create.pb.js hook makes her the
  // founding admin; add the others as members.
  // ---------------------------------------------------------------------
  const sannePb = new PocketBase(POCKETBASE_URL);
  await sannePb.collection("users").authWithPassword("sanne@trek.app", DEMO_PASSWORD);
  const group = await sannePb.collection("groups").create({
    name: "Huize Vrolik",
    address: "Vrolikstraat 42, Utrecht",
  });

  for (const name of ["Tom", "Ahmed", "Femke"]) {
    await pb.collection("group_members").create({ group: group.id, user: userIds[name], role: "member" });
  }
  console.log(`Groep "Huize Vrolik" aangemaakt met 4 leden.`);

  const invite = await pb.collection("group_invites").create({
    group: group.id,
    code: "VROLIK24",
    created_by: userIds.Sanne,
    uses_count: 0,
  });
  console.log(`Uitnodigingscode: ${invite.code}`);

  // ---------------------------------------------------------------------
  // Recurring series — created through the normal API as Sanne, so the
  // real generation hook produces its occurrences.
  // ---------------------------------------------------------------------
  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  await sannePb.collection("event_series").create({
    group: group.id,
    organizer: userIds.Sanne,
    title: "Wekelijkse huisdiner",
    default_recipe: recipeIds["Spaghetti carbonara"],
    rrule_freq: "weekly",
    rrule_byweekday: "wed",
    start_time: "18:30",
    start_date: `${startDate} 00:00:00.000Z`,
    cook_rotation_enabled: true,
    cook_rotation_order: [userIds.Sanne, userIds.Tom, userIds.Ahmed, userIds.Femke],
    active: true,
  });
  console.log("Wekelijkse serie aangemaakt (occurrences door de hook gegenereerd).");

  // ---------------------------------------------------------------------
  // A loose, shareable event with a couple of guest RSVPs already on it,
  // and a surprise event to demo the cook-vs-attendee view difference.
  // ---------------------------------------------------------------------
  const inFiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const looseEvent = await sannePb.collection("events").create({
    organizer: userIds.Sanne,
    title: "Etentje met de buren",
    starts_at: inFiveDays,
    location: "Vrolikstraat 42",
    is_surprise: false,
    status: "scheduled",
    total_cost_cents: 3250,
    share_token: "vrolik-buren-demo",
  });
  await pb.collection("event_meals").create({ event: looseEvent.id, recipe: recipeIds["Pad thai met garnalen"] });
  await pb.collection("rsvps").create({ event: looseEvent.id, guest_name: "Buurman Joris", status: "yes" });
  await pb.collection("rsvps").create({ event: looseEvent.id, guest_name: "Buurvrouw Rita", status: "yes" });
  console.log(`Los deelbaar etentje aangemaakt: /share/${looseEvent.share_token}`);

  const inTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const surpriseEvent = await sannePb.collection("events").create({
    group: group.id,
    organizer: userIds.Sanne,
    cook: userIds.Tom,
    starts_at: inTwoDays,
    is_surprise: true,
    status: "scheduled",
  });
  await pb.collection("event_meals").create({ event: surpriseEvent.id, recipe: recipeIds["Gehaktballen met jus"] });
  console.log("Verrassingsetentje aangemaakt (kok: Tom).");

  console.log("\nKlaar. Demo-inloggegevens:");
  for (const def of userDefs) console.log(`  ${def.email} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error("Seed-script mislukt:", err);
  process.exit(1);
});
