export type Relationship = "friend" | "partner" | "coworker" | "kid" | "parent" | "pet";
export type Tone = "wholesome" | "cheeky" | "roast";
export type Length = "one-liner" | "paragraph";
export type ThemeId = "party" | "minimalist";
export type CardFont = "serif" | "hand" | "modern";
export type RibbonColor = "rose" | "gold" | "lilac" | "mint";

export type GenerateOptions = {
  relationship: Relationship;
  tone: Tone;
  length: Length;
  /** Softer humor, no roast, warmer pet language when pets are part of the joke or the guest list. */
  petFriendly?: boolean;
};
