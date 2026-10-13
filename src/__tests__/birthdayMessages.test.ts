import { describe, expect, it, vi } from "vitest";
import {
  buildTemplates,
  effectiveTone,
  hobbyBlurb,
  joinHobbiesList,
  ordinal,
  parseHobbies,
  pickIndex,
} from "../birthdayMessages";
import type { Relationship, Tone } from "../types";

describe("ordinal", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
    [101, "101st"],
    [111, "111th"],
    [112, "112th"],
    [130, "130th"],
  ])("%i -> %s", (n, expected) => {
    expect(ordinal(n)).toBe(expected);
  });
});

describe("parseHobbies", () => {
  it("splits on commas and trims", () => {
    expect(parseHobbies(" chess ,  hiking,baking ")).toEqual(["chess", "hiking", "baking"]);
  });
  it("drops empty entries", () => {
    expect(parseHobbies(",, ,chess,,")).toEqual(["chess"]);
  });
  it("returns [] for blank input", () => {
    expect(parseHobbies("   ")).toEqual([]);
    expect(parseHobbies("")).toEqual([]);
  });
});

describe("joinHobbiesList", () => {
  it("handles 0, 1, 2 and 3+ items", () => {
    expect(joinHobbiesList([])).toBe("");
    expect(joinHobbiesList(["a"])).toBe("a");
    expect(joinHobbiesList(["a", "b"])).toBe("a and b");
    expect(joinHobbiesList(["a", "b", "c"])).toBe("a, b, and c");
  });
});

describe("effectiveTone", () => {
  it("keeps roast for friends and partners", () => {
    expect(effectiveTone("friend", "roast")).toBe("roast");
    expect(effectiveTone("partner", "roast")).toBe("roast");
    expect(effectiveTone("parent", "roast")).toBe("roast");
  });
  it.each<Relationship>(["pet", "kid", "coworker"])("softens roast for %s", (rel) => {
    expect(effectiveTone(rel, "roast")).toBe("cheeky");
  });
  it("softens roast when pet-friendly", () => {
    expect(effectiveTone("friend", "roast", true)).toBe("cheeky");
  });
  it("never changes other tones", () => {
    expect(effectiveTone("pet", "wholesome")).toBe("wholesome");
    expect(effectiveTone("kid", "cheeky")).toBe("cheeky");
  });
});

describe("hobbyBlurb keyword matching", () => {
  const blurb = (h: string) => hobbyBlurb(h, false, false);
  const generic = (h: string) => `${h} energy that deserves its own parade`;

  it("matches obvious hobbies", () => {
    expect(blurb("sourdough")).toContain("starters");
    expect(blurb("chess")).toContain("frosting");
    expect(blurb("running")).toContain("miles");
    expect(blurb("reading")).toContain("chapters");
    expect(blurb("painting")).toContain("brushstrokes");
    expect(blurb("hiking")).toContain("trails");
    expect(blurb("hike")).toContain("trails");
  });

  it("does not match keywords inside unrelated words", () => {
    expect(blurb("vacation")).not.toContain("supervision");
    expect(blurb("party planning")).toBe(generic("party planning"));
    expect(blurb("smart home gadgets")).toBe(generic("smart home gadgets"));
    expect(blurb("brunch")).toBe(generic("brunch"));
    expect(blurb("thread")).toBe(generic("thread"));
  });

  it("prefers the more specific 'board games' rule", () => {
    expect(blurb("board games")).toContain("age like fine cheddar");
    expect(blurb("video games")).toContain("one more round");
  });

  it("falls back to a generic line", () => {
    expect(blurb("Underwater Basket Weaving")).toBe(generic("Underwater Basket Weaving"));
  });

  it("uses pet-star lines only for pets", () => {
    expect(hobbyBlurb("sunbeam", true, true)).toContain("napping");
    expect(hobbyBlurb("sunbeam", true, false)).toBe(generic("sunbeam"));
  });

  it("softens animal jokes when pet-friendly", () => {
    expect(hobbyBlurb("cats", true, false)).toContain("honored to serve");
    expect(hobbyBlurb("cats", false, false)).toContain("supervision");
  });
});

describe("buildTemplates", () => {
  const relationships: Relationship[] = ["friend", "partner", "coworker", "kid", "parent", "pet"];
  const tones: Tone[] = ["wholesome", "cheeky", "roast"];

  it.each(relationships.flatMap((r) => tones.map((t) => [r, t] as const)))(
    "produces non-empty, fully-interpolated lines for %s / %s",
    (relationship, tone) => {
      for (const length of ["one-liner", "paragraph"] as const) {
        const pool = buildTemplates("Jordan", 32, ["chess", "hiking"], { relationship, tone, length });
        expect(pool.length).toBeGreaterThan(0);
        for (const line of pool) {
          expect(line.trim().length).toBeGreaterThan(0);
          expect(line).not.toMatch(/undefined|NaN|\[object|\$\{/);
        }
      }
    },
  );

  it("includes the name in generated lines", () => {
    const pool = buildTemplates("Jordan", 32, ["chess"], { relationship: "friend", tone: "cheeky", length: "one-liner" });
    expect(pool.some((l) => l.includes("Jordan"))).toBe(true);
  });

  it("paragraph mode is longer than one-liner mode", () => {
    const base = { relationship: "friend", tone: "cheeky" } as const;
    const one = buildTemplates("Sam", 30, ["chess"], { ...base, length: "one-liner" });
    const para = buildTemplates("Sam", 30, ["chess"], { ...base, length: "paragraph" });
    expect(para[0].length).toBeGreaterThan(one[0].length);
    expect(para[0]).toContain("\n\n");
  });

  it("adds milestone lines on milestone ages only", () => {
    const opts = { relationship: "friend", tone: "cheeky", length: "one-liner" } as const;
    const milestone = buildTemplates("Sam", 30, ["chess"], opts);
    const plain = buildTemplates("Sam", 31, ["chess"], opts);
    expect(milestone.length).toBeGreaterThan(plain.length);
  });

  it("adds extra pet-friendly lines when enabled", () => {
    const opts = { relationship: "friend", tone: "cheeky", length: "one-liner" } as const;
    const off = buildTemplates("Sam", 31, ["cats"], opts);
    const on = buildTemplates("Sam", 31, ["cats"], { ...opts, petFriendly: true });
    expect(on.length).toBeGreaterThan(off.length);
  });

  it("handles a single hobby, many hobbies and age 1 / 130", () => {
    const opts = { relationship: "friend", tone: "wholesome", length: "one-liner" } as const;
    expect(() => buildTemplates("A", 1, ["x"], opts)).not.toThrow();
    expect(() => buildTemplates("A", 130, ["a", "b", "c", "d", "e"], opts)).not.toThrow();
  });

  it("does not interpret HTML or special characters in names", () => {
    const pool = buildTemplates("<b>Zoë</b> & $1", 40, ["x"], { relationship: "friend", tone: "cheeky", length: "one-liner" });
    expect(pool.some((l) => l.includes("<b>Zoë</b> & $1"))).toBe(true);
  });
});

describe("pickIndex", () => {
  it("returns 0 for empty and single pools", () => {
    expect(pickIndex(0)).toBe(0);
    expect(pickIndex(1)).toBe(0);
    expect(pickIndex(1, 0)).toBe(0);
  });
  it("stays within bounds", () => {
    for (let i = 0; i < 200; i++) {
      const idx = pickIndex(5);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(5);
    }
  });
  it("avoids the previous index when possible", () => {
    for (let i = 0; i < 200; i++) expect(pickIndex(3, 1)).not.toBe(1);
  });
  it("terminates even if randomness keeps returning the avoided index", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickIndex(4, 0)).toBe(0);
    spy.mockRestore();
  });
});
