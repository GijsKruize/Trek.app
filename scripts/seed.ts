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
import { readFileSync } from "node:fs";
import { join } from "node:path";

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? "http://127.0.0.1:8090";
const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL ?? "admin@trek.app";
const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD ?? "TrekAdmin123!";

const pb = new PocketBase(POCKETBASE_URL);

// Photos sourced from Wikimedia Commons (CC-licensed) for local demo
// purposes — see scripts/seed-assets/. Not shipped in a production build.
const ASSETS_DIR = join(process.cwd(), "scripts", "seed-assets");

function imageFile(filename: string): File {
  const bytes = readFileSync(join(ASSETS_DIR, filename));
  return new File([bytes], filename, { type: "image/jpeg" });
}

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
    image: string;
    ingredients: Array<{ name: string; quantity: number; unit: string; note?: string }>;
  }> = [
    {
      title: "Spaghetti carbonara",
      description: "Romig, snel, en altijd een succes aan tafel.",
      servings: 4,
      prep_minutes: 25,
      instructions: "Kook de spaghetti. Bak de spekreepjes krokant. Mix eieren met parmezaanse kaas. Mix alles samen van het vuur af.",
      image: "spaghetti_carbonara.jpg",
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
      image: "groene_curry.jpg",
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
      image: "linzensoep.jpg",
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
      image: "zalm_broccoli.jpg",
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
      image: "pad_thai.jpg",
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
      image: "kikkererwtencurry.jpg",
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
      image: "gehaktballen.jpg",
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
      image: "courgette_pesto.jpg",
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
      image: "tofu_wok.jpg",
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
      image: "pannenkoeken.jpg",
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
      image: imageFile(def.image),
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
  console.log(`${recipeDefs.length} recepten aangemaakt (met foto's).`);

  // ---------------------------------------------------------------------
  // Ads
  // ---------------------------------------------------------------------
  const adDefs: Array<{ title: string; teaser: string; link_url: string; sort_weight: number; image: string; isAlcohol?: boolean }> = [
    {
      title: "Verse kaas van de boerderij",
      teaser: "10% korting voor studentenhuizen — vraag naar de Trek?-deal.",
      link_url: "https://example.com",
      sort_weight: 10,
      image: "",
    },
    {
      title: "Wekelijkse boodschappenbox",
      teaser: "Verse ingrediënten, geen gedoe. Eerste box gratis.",
      link_url: "https://example.com",
      sort_weight: 5,
      image: "",
    },
    {
      title: "Albert Heijn — AH Bonus",
      teaser: "Deze week: 25% korting op alles voor het studentendiner. Scan, bespaar, eet.",
      link_url: "https://www.ah.nl",
      sort_weight: 20,
      image: "ad_albert_heijn.jpg",
    },
    {
      title: "Viper Energy",
      teaser: "Nog een huishoudvergadering na het eten? Viper houdt je wakker. Nu met studentenkorting.",
      link_url: "https://example.com/viper",
      sort_weight: 15,
      image: "ad_viper.jpg",
    },
    {
      title: "Nike — Pegasus 41",
      teaser: "Na de pasta, de hardloopschoenen. Train zoals je eet: met Trek?.",
      link_url: "https://www.nike.com",
      sort_weight: 12,
      image: "ad_nike.jpg",
    },
    {
      // Business plan §6.1 example brand; demonstrates alcohol-ad
      // gating (§6.1/§10) — only shown to users who've confirmed 18+
      // (see userDefs.birth_date above and src/lib/api/age.ts).
      title: "Bavaria",
      teaser: "Erbij bij elke jaarclubborrel. Alleen zichtbaar voor 18+.",
      link_url: "https://example.com/bavaria",
      sort_weight: 8,
      image: "",
      isAlcohol: true,
    },
  ];

  for (const def of adDefs) {
    await pb.collection("ads").create({
      title: def.title,
      teaser: def.teaser,
      link_url: def.link_url,
      active: true,
      sort_weight: def.sort_weight,
      is_alcohol: def.isAlcohol ?? false,
      ...(def.image ? { image: imageFile(def.image) } : {}),
    });
  }
  console.log(`${adDefs.length} advertenties aangemaakt (3 met foto, 1 alcoholgerelateerd).`);

  // ---------------------------------------------------------------------
  // Demo users
  // ---------------------------------------------------------------------
  const userDefs = [
    // Sanne has a birth_date set — demonstrates alcohol-ad gating (§6.1/§10)
    // actually letting an 18+-confirmed user see the one alcohol ad; the
    // other three leave it unset, the realistic "not yet confirmed" default
    // that keeps that ad hidden from them regardless of their real age.
    { email: "sanne@trek.app", name: "Sanne", phone: "+31612345601", diet_tags: ["vegetarisch"], allergies: [] as string[], birth_date: "2003-04-12" },
    { email: "tom@trek.app", name: "Tom", phone: "+31612345602", diet_tags: [], allergies: ["Pinda's"], birth_date: "" },
    { email: "ahmed@trek.app", name: "Ahmed", phone: "+31612345603", diet_tags: ["halal"], allergies: [], birth_date: "" },
    { email: "femke@trek.app", name: "Femke", phone: "+31612345604", diet_tags: ["lactosevrij"], allergies: ["Amandelen"], birth_date: "" },
  ];
  const DEMO_PASSWORD = "Wachtwoord123!";

  const userIds: Record<string, string> = {};
  for (const def of userDefs) {
    const user = await pb.collection("users").create({
      email: def.email,
      password: DEMO_PASSWORD,
      passwordConfirm: DEMO_PASSWORD,
      name: def.name,
      phone: def.phone,
      diet_tags: def.diet_tags,
      allergy_ingredients: def.allergies.map((name) => ingredientIds[name]),
      ...(def.birth_date ? { birth_date: def.birth_date } : {}),
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
  // Both get an RSVP deadline (day before, 17:00) to show the lock state.
  // ---------------------------------------------------------------------
  function dayBeforeDeadline(startsAtIso: string): string {
    const deadline = new Date(startsAtIso);
    deadline.setDate(deadline.getDate() - 1);
    deadline.setHours(17, 0, 0, 0);
    return deadline.toISOString();
  }

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
    rsvp_deadline: dayBeforeDeadline(inFiveDays),
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
    rsvp_deadline: dayBeforeDeadline(inTwoDays),
  });
  await pb.collection("event_meals").create({ event: surpriseEvent.id, recipe: recipeIds["Gehaktballen met jus"] });
  console.log("Verrassingsetentje aangemaakt (kok: Tom).");

  // A group event with RSVPs in but *no* recipe chosen yet — demos the
  // allergy-aware recipe picker (Tom is allergic to pinda's, Femke to
  // amandelen; both have RSVP'd "yes", so e.g. "Pad thai met garnalen"
  // and "Pannenkoeken" show up flagged when Sanne picks the meal).
  const inFourDays = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
  const noRecipeEvent = await sannePb.collection("events").create({
    group: group.id,
    organizer: userIds.Sanne,
    title: "Donderdagdiner",
    starts_at: inFourDays,
    location: "Vrolikstraat 42",
    is_surprise: false,
    status: "scheduled",
    rsvp_deadline: dayBeforeDeadline(inFourDays),
  });
  await pb.collection("rsvps").create({ event: noRecipeEvent.id, user: userIds.Tom, status: "yes" });
  await pb.collection("rsvps").create({ event: noRecipeEvent.id, user: userIds.Femke, status: "yes" });
  console.log('Groepsetentje "Donderdagdiner" aangemaakt zonder recept (kies het recept op de eventpagina als Sanne).');

  console.log("\nKlaar. Demo-inloggegevens:");
  for (const def of userDefs) console.log(`  ${def.email} / ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error("Seed-script mislukt:", err);
  process.exit(1);
});
