import type { GenerateOptions, Relationship, Tone } from "./types";

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Split comma-separated hobbies; trims and drops empties. */
export function parseHobbies(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinHobbiesList(hobbies: string[]): string {
  return joinEnglishList(hobbies);
}

function joinEnglishList(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

export function effectiveTone(relationship: Relationship, tone: Tone, petFriendly?: boolean): Tone {
  if (petFriendly && tone === "roast") return "cheeky";
  if (relationship === "pet" && tone === "roast") return "cheeky";
  if (relationship === "kid" && tone === "roast") return "cheeky";
  if (relationship === "coworker" && tone === "roast") return "cheeky";
  return tone;
}

function hobbyBlurb(hobby: string, petFriendly: boolean, isPetStar: boolean): string {
  const h = hobby.trim();
  const lower = h.toLowerCase();

  if (isPetStar) {
    const petLike: Array<{ test: (s: string) => boolean; blurb: (display: string) => string }> = [
      { test: (s) => /treat|snack|cheese|peanut|cookie|bone/i.test(s), blurb: (d) => `${d} tastings (five-star reviews only)` },
      { test: (s) => /walk|hike|yard|park/i.test(s), blurb: (d) => `${d} patrols with maximum tail velocity` },
      { test: (s) => /fetch|ball|toy|squeak|frisbee/i.test(s), blurb: (d) => `${d} athletics—rookie humans need not apply` },
      { test: (s) => /nap|sleep|sunbeam|couch|bed|blanket/i.test(s), blurb: (d) => `${d} championship napping` },
      { test: (s) => /squirrel|mail|delivery|window/i.test(s), blurb: (d) => `${d} surveillance detail (unpaid but passionate)` },
      { test: (s) => /swim|water|splash/i.test(s), blurb: (d) => `${d} splash zone expertise` },
      { test: (s) => /catnip|laser|red\s*dot/i.test(s), blurb: (d) => `${d}—high art, zero regrets` },
    ];
    for (const { test, blurb } of petLike) {
      if (test(lower)) return blurb(h);
    }
  }

  const rules: Array<{ test: (s: string) => boolean; blurb: (display: string) => string }> = [
    { test: (s) => /sourdough/.test(s), blurb: (d) => `${d} starters that deserve their own agent` },
    { test: (s) => /bake|baking|oven|pastry/i.test(s), blurb: (d) => `${d} with main-character crumb structure` },
    { test: (s) => /chess/.test(s), blurb: (d) => `${d} moves sneaky enough to steal frosting` },
    { test: (s) => /yoga|meditat|mindful/i.test(s), blurb: (d) => `${d} zen strong enough to survive party small talk` },
    { test: (s) => /run|jogg|marathon/i.test(s), blurb: (d) => `${d} miles logged like birthday XP` },
    { test: (s) => /hike|trail|climb/i.test(s), blurb: (d) => `${d} trails that owe you a scenic thank-you note` },
    { test: (s) => /swim|pool|lap/i.test(s), blurb: (d) => `${d} laps smoother than buttercream` },
    {
      test: (s) => /rescue\s*dog|dogs?|puppy|canine/i.test(s),
      blurb: (d) =>
        petFriendly
          ? `${d} love in its purest, waggiest form`
          : `${d} energy (treat budget: justified)`,
    },
    {
      test: (s) => /cat|kitten|feline/i.test(s),
      blurb: (d) =>
        petFriendly
          ? `${d} companions who clearly run the house—and you’re honored to serve`
          : `${d} supervision of all human activities`,
    },
    {
      test: (s) =>
        /\b(hamster|gerbil|bunnies|bunny|rabbits?|ferrets?|parrots?|birds?|reptiles?|snakes?|lizards?|turtles?|fish|aquarium|pets?)\b/i.test(
          s,
        ) || /\bguinea\s*pigs?\b/i.test(s),
      blurb: (d) =>
        petFriendly
          ? `${d}—small (or scaly) roommates, enormous heart quota`
          : `${d} roommates who never pay rent but get away with it`,
    },
    { test: (s) => /photo|camera|lens/i.test(s), blurb: (d) => `${d} shots worth framing next to the cake` },
    { test: (s) => /garden|plant|succulent/i.test(s), blurb: (d) => `${d} green-thumb victories` },
    { test: (s) => /knit|crochet|yarn|sew/i.test(s), blurb: (d) => `${d} stitches tighter than your gift wrap game` },
    { test: (s) => /guitar|piano|music|drum|violin|band/i.test(s), blurb: (d) => `${d} riffs that deserve a birthday encore` },
    { test: (s) => /read|book|novel|kindle/i.test(s), blurb: (d) => `${d} chapters devoured past bedtime` },
    { test: (s) => /game|gaming|switch|steam|minecraft|fortnite/i.test(s), blurb: (d) => `${d} sessions where “one more round” is law` },
    { test: (s) => /code|coding|program|hackathon|github/i.test(s), blurb: (d) => `${d} commits that ship good vibes` },
    { test: (s) => /art|paint|draw|sketch|pottery/i.test(s), blurb: (d) => `${d} brushstrokes with birthday-bright color` },
    { test: (s) => /cook(?!ie)|chef|kitchen|recipe|spice/i.test(s), blurb: (d) => `${d} flavors that steal the spotlight from the entrée` },
    { test: (s) => /wine|cellar|vineyard/i.test(s), blurb: (d) => `${d} pours poured with sommelier confidence` },
    { test: (s) => /coffee|espresso|latte|barista/i.test(s), blurb: (d) => `${d} crema worthy of a holiday special` },
    { test: (s) => /travel|trip|flight|passport/i.test(s), blurb: (d) => `${d} stamps that brag in the best way` },
    { test: (s) => /movie|film|cinema|tv\s*show/i.test(s), blurb: (d) => `${d} watchlists with impeccable taste` },
    { test: (s) => /volunteer|nonprofit|charity/i.test(s), blurb: (d) => `${d} hours that make the world less ridiculous` },
    { test: (s) => /board\s*game|puzzle|crossword/i.test(s), blurb: (d) => `${d} plays that age like fine cheddar` },
  ];

  for (const { test, blurb } of rules) {
    if (test(lower)) return blurb(h);
  }

  return `${h} energy that deserves its own parade`;
}

type Ctx = {
  name: string;
  age: number;
  o: string;
  H: string;
  N: string;
  nAre: string;
  younger: number;
  relWord: string;
  petFriendly: boolean;
  relationship: Relationship;
};

function relWord(r: Relationship): string {
  switch (r) {
    case "friend":
      return "friend";
    case "partner":
      return "partner";
    case "coworker":
      return "coworker";
    case "kid":
      return "superstar";
    case "parent":
      return "parent";
    case "pet":
      return "companion";
  }
}

function relationshipHooks(ctx: Ctx, rel: Relationship): string[] {
  const { name, o, H } = ctx;
  switch (rel) {
    case "friend":
      return [
        `To my favorite chaos colleague, ${name}: happy ${o}!`,
        `Friend-tier news: ${name} unlocks ${o} today—${H} included.`,
      ];
    case "partner":
      return [
        `To my favorite human—happy ${o}, ${name}.`,
        `Partner protocol: celebrate ${name} turning ${o} with maximum ${H}.`,
      ];
    case "coworker":
      return [
        `Office bulletin: ${name} levels up to ${o}!`,
        `Coworker respect increased: ${name}, ${o} looks professional on you.`,
      ];
    case "kid":
      return [
        `Big cheer for ${name} turning ${o}!`,
        `Kid crew verdict: ${name} + ${H} = automatic birthday win.`,
      ];
    case "parent":
      return [
        `Parent-mode legend ${name}—happy ${o}!`,
        `Family announcement: ${name} makes ${o} look effortless.`,
      ];
    case "pet":
      return [
        `Birthday boops to ${name}—${o} looks adorable on you.`,
        `Treat report: ${name} turns ${o}; ${H} supplies must be fully stocked.`,
      ];
  }
}

const MILESTONE_AGES = new Set([16, 18, 21, 25, 30, 40, 50, 60]);

function milestoneExtras(ctx: Ctx): string[] {
  if (!MILESTONE_AGES.has(ctx.age)) return [];
  const { name, o, H, N, relationship } = ctx;

  if (relationship === "pet") {
    const pm: Partial<Record<number, string[]>> = {
      16: [`${name}, ${o}! More ${H}, more zoomies, more mail to side-eye.`],
      18: [`${name} hits ${o}! ${H} passion still set to “maximum loyal.”`],
      21: [`Legal drinking age is irrelevant—${name} is ${o} and ${H} is the real celebration.`],
      25: [`Quarter-century ${name}! ${H} stamina: undefeated.`],
      30: [`Flirty ${o} energy, ${name}? Only if it involves ${H} and chin scratches.`],
      40: [`Fabulous ${o}, ${name}! ${H} only gets more iconic.`],
      50: [`Half a hundred, ${name}! ${H} and naps: both perfected.`],
      60: [`Sensational ${o}, ${name}! ${H} and gray muzzles look good on legends.`],
    };
    return pm[ctx.age] ?? [];
  }

  const m: Partial<Record<number, string[]>> = {
    16: [
      `${name}, sweet ${o}! Bigger adventures, same excellent taste in ${H}.`,
      `License to drive + ${o} candles—${name}, the world isn’t ready (in a good way).`,
    ],
    18: [
      `${name}, welcome to ${o}: adult menus, bigger dreams, same obsession with ${H}.`,
      `Eighteen looks good on you, ${name}—may ${N} stay wildly fun.`,
    ],
    21: [
      `${name}, ${o}! Celebrate loudly—${H} stories optional but encouraged.`,
      `Twenty-one salute to ${name}: may your ${H} hobby receipts stay legendary.`,
    ],
    25: [
      `Quarter-century mode: ${name} hits ${o} with ${H} on full display.`,
    ],
    30: [
      `${name}, ${o} and thriving—${H} is Exhibit A of excellent priorities.`,
      `Flirty ${o} energy unlocked, ${name}. ${N} may now be used as bragging rights.`,
    ],
    40: [
      `${name}, fabulous ${o}! ${H} proves fun doesn’t expire.`,
    ],
    50: [
      `Half a hundred, ${name}! ${H} hobbies, full happiness—happy ${o}.`,
    ],
    60: [
      `${name}, sensational ${o}! ${H} and joy both aging beautifully.`,
    ],
  };
  return m[ctx.age] ?? [];
}

function petFriendlyLines(ctx: Ctx): string[] {
  const { name, o, H, relationship } = ctx;
  if (relationship === "pet") {
    return [
      `Happy ${o}, ${name}! May ${H} multiply, naps lengthen, and suspicious noises outside get the attention they deserve.`,
      `Wishing ${name} a ${o} stacked with snacks, soft spots in the sun, and humans who understand the assignment.`,
      `${name}: official ${o} status unlocked—${H} enthusiasm remains the household gold standard.`,
      `Birthday memo for humans: more ${H}, fewer spreadsheets, maximum ear scratches for ${name}.`,
    ];
  }
  return [
    `Happy ${o}, ${name}! The pets in your orbit cast a unanimous “yes” vote for more cake, more cuddles, and more ${H}.`,
    `Wishing ${name} a ${o} where every wag, purr, and happy chirp celebrates you right back.`,
    `${name}: ${o} years of being the human your animals clearly chose in the draft—well played.`,
    `Pet-safe birthday memo: joy for you, extra scritches for them, zero side-eye from the cat.`,
  ];
}

function pickSecondPetStar(tone: Tone, ctx: Ctx): string {
  const { name, o, H, N } = ctx;
  const wholesome = [
    `Your people are lucky to be on ${name}’s staff—extra ${H} rations are approved.`,
    `Hope ${o} brings you soft beds, good smells, and humans who read your mind, ${name}.`,
    `The world is better with your ${H} energy in it, ${name}—happy ${o}.`,
    `Thank you for being the kind of ${ctx.relWord} who makes every day sillier and warmer, ${name}.`,
  ];
  const cheeky = [
    `May your ${H} hits today crash the cuteness server, ${name}.`,
    `${N} is a lot of excellence for one birthday, ${name}—pace yourself between naps.`,
    `At ${o}, you’ve earned diplomatic immunity from baths… briefly, ${name}.`,
    `Another lap around the sun and you’re still the CEO of ${H}, ${name}.`,
  ];
  const pool = tone === "wholesome" ? wholesome : cheeky;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickSecond(tone: Tone, ctx: Ctx): string {
  const { name, o, H, N, petFriendly, relationship } = ctx;
  if (relationship === "pet") {
    return pickSecondPetStar(tone, ctx);
  }
  const wholesome = [
    `So glad your people get another year of you, ${name}.`,
    `You make good days better—especially when ${H} is involved.`,
    `Wishing you gentle wins, loud laughter, and ${N} on repeat.`,
    `Thank you for being the kind of ${ctx.relWord} who makes life warmer.`,
  ];
  const cheeky = [
    `If ${H} were an Olympic sport, you’d be on the podium, ${name}.`,
    `Cake calories don’t count when ${N} is this iconic.`,
    `We’re all just living in the universe ${name} decorates with ${H}.`,
    `Another year of you being suspiciously good at ${H}—keep it up.`,
  ];
  const roast = [
    `Another lap around the sun and you’re still pretending ${H} is “just a hobby,” ${name}.`,
    `Science can’t explain how ${N} and birthday cake coexist—yet here you are.`,
    `At this point ${H} is basically your brand, ${name}. Trademark pending.`,
    `Age is just a number; ${H} is the real spreadsheet, ${name}.`,
  ];
  const petWing = [
    `Official paw-print approval: ${name}’s ${o} celebration is hereby rated five stars by the household animals.`,
    `Treats for the pets, cake for you—${name}, that’s the birthday treaty we all support.`,
    `Your pets would like it noted that ${H} time still includes them, obviously.`,
    `Warm fuzzies all around—two-legged and four-legged fans included, ${name}.`,
  ];
  let pool = tone === "wholesome" ? wholesome : tone === "roast" ? roast : cheeky;
  if (petFriendly && Math.random() < 0.5) {
    pool = petWing;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function oneLinersWholesome(ctx: Ctx): string[] {
  const { name, o, H, N, nAre, younger, relWord } = ctx;
  return [
    `Happy ${o}, ${name}! May ${N} bring you steady joy and the sweetest ordinary days.`,
    `${name}, you’re ${o} and such a gift as a ${relWord}—cheers to ${H} and good company.`,
    `Celebrating ${name} at ${o}: may kindness find you as often as ${H} does.`,
    `Happy birthday, ${name}! ${H} suits you—${N} ${nAre} proof you’re doing life right.`,
    `Here’s to ${o}, ${name}! May ${N} feel like a warm light on a cozy night.`,
    `They say ${o} is the new ${younger}. Either way, ${name}, you make it look kind.`,
    `${name}: ${o} candles, infinite reasons we’re lucky you exist—${H} included.`,
    `Wishing ${name} a ${o} birthday wrapped in laughter, cake, and ${N}.`,
  ];
}

function oneLinersCheeky(ctx: Ctx): string[] {
  const { name, o, H, N, nAre, younger } = ctx;
  return [
    `Happy ${o}, ${name}! May ${N} level up faster than your cake disappears.`,
    `${name}, you’re ${o} and still choosing ${H} over “sensible hobbies”—${N} and all. Respect.`,
    `Official decree: ${name} is ${o} today. Celebratory mandate: honor ${N} for at least one glorious hour.`,
    `${o} looks good on you, ${name}—especially when you’re deep in ${H} and living ${N}.`,
    `Happy birthday, ${name}! At ${o}, you’ve earned the right to be gloriously weird about ${H} in public (${N}).`,
    `They say ${o} is the new ${younger}. They’re wrong—but ${N} ${nAre} forever, ${name}.`,
    `${name}: ${o} candles, zero excuses not to dive into ${H}—and flex ${N} while you’re at it.`,
    `Happy ${o}, ${name}! You’re not “getting old”—you’re unlocking premium ${H} content: ${N}.`,
  ];
}

function oneLinersRoast(ctx: Ctx): string[] {
  const { name, o, H, N, younger } = ctx;
  return [
    `Happy ${o}, ${name}! ${N} is a lot—almost as much drama as your ${H} “casual phase.”`,
    `${name} hits ${o} still acting like ${H} won’t take over the calendar. Adorable.`,
    `Another year, another stack of ${H} receipts, ${name}. ${o} won’t judge—but I might.`,
    `${o}? Bold choice, ${name}. ${N} suggests you’re not even pretending to chill.`,
    `Happy birthday, ${name}! At ${o}, your ${H} obsession is basically a personality tax we all pay gladly.`,
    `They say ${o} is the new ${younger}. You say ${H} is the new sleep schedule. Both tracks, ${name}.`,
    `${name}: ${o} candles and ${N}—a combo nobody’s emotionally ready for.`,
    `Premium ${H} chaos, ${name}? ${o} says “subscribe.”`,
  ];
}

function withParagraph(base: string[], tone: Tone, ctx: Ctx): string[] {
  return base.map((line) => `${line}\n\n${pickSecond(tone, ctx)}`);
}

export function buildTemplates(
  name: string,
  age: number,
  hobbies: string[],
  opts: GenerateOptions,
): string[] {
  const isPetStar = opts.relationship === "pet";
  const petFriendly = opts.petFriendly === true || isPetStar;
  const tone = effectiveTone(opts.relationship, opts.tone, petFriendly);
  const o = ordinal(age);
  const younger = Math.max(1, age - 5);
  const H = joinEnglishList(hobbies);
  const nods = hobbies.map((h) => hobbyBlurb(h, petFriendly, isPetStar));
  const N = joinEnglishList(nods);
  const nAre = hobbies.length > 1 ? "are" : "is";
  const ctx: Ctx = {
    name,
    age,
    o,
    H,
    N,
    nAre,
    younger,
    relWord: relWord(opts.relationship),
    petFriendly,
    relationship: opts.relationship,
  };

  const core =
    tone === "wholesome" ? oneLinersWholesome(ctx) : tone === "roast" ? oneLinersRoast(ctx) : oneLinersCheeky(ctx);

  const sized = opts.length === "paragraph" ? withParagraph(core, tone, ctx) : core;

  const petExtras = petFriendly ? petFriendlyLines(ctx) : [];

  return [...sized, ...relationshipHooks(ctx, opts.relationship), ...milestoneExtras(ctx), ...petExtras];
}

export function pickIndex(poolLength: number, avoid?: number): number {
  if (poolLength < 1) return 0;
  if (poolLength === 1) return 0;
  let idx = Math.floor(Math.random() * poolLength);
  if (avoid !== undefined) {
    let guard = 0;
    while (idx === avoid && guard++ < 50) {
      idx = Math.floor(Math.random() * poolLength);
    }
  }
  return idx;
}
