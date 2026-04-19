import type { Relationship, RibbonColor, ThemeId } from "./types";

export const CONFETTI_PALETTES: Record<ThemeId, string[]> = {
  party: ["#ff7b9c", "#c4a8ff", "#ffb86c", "#7dcea0", "#7ec8e3", "#fff0a6"],
  minimalist: ["#c8c8c8", "#a8a8a8", "#e2e2e2", "#9a9a9a", "#d4d4d4", "#b0b0b0"],
};

export const RIBBON_CSS: Record<RibbonColor, { ribbon: string; cover: string }> = {
  rose: {
    cover: "linear-gradient(90deg, #9a3d52, #c45c6a)",
    ribbon: "linear-gradient(180deg, #ffd0d8, #e889a8)",
  },
  gold: {
    cover: "linear-gradient(90deg, #8a7020, #c9a227)",
    ribbon: "linear-gradient(180deg, #ffe29a, #d4a84b)",
  },
  lilac: {
    cover: "linear-gradient(90deg, #5c4a8a, #7b6ba8)",
    ribbon: "linear-gradient(180deg, #e8deff, #c9b6ff)",
  },
  mint: {
    cover: "linear-gradient(90deg, #2d6a58, #3d8a72)",
    ribbon: "linear-gradient(180deg, #c8f5e8, #8be3c3)",
  },
};

/** Confetti accents when Party theme is on (Minimalist keeps gray palette). */
export const RELATIONSHIP_CONFETTI: Record<Relationship, string[]> = {
  friend: ["#7ec8e3", "#c9b6ff", "#ffb86c", "#ff7b9c", "#fff0a6", "#98d8aa"],
  partner: ["#ff7b9c", "#ffd0d8", "#c9b6ff", "#ffe29a", "#f4a4c0"],
  coworker: ["#7dcea0", "#7ec8e3", "#b8c5ff", "#d4e157", "#90caf9"],
  kid: ["#ffb86c", "#fff0a6", "#8be3c3", "#ff7b9c", "#81d4fa"],
  parent: ["#c9a227", "#ffe29a", "#c45c6a", "#8be3c3", "#b39ddb"],
  pet: ["#98d8aa", "#c8f5e8", "#ffd0d8", "#ffe29a", "#b2ebf2", "#ffcc80"],
};
