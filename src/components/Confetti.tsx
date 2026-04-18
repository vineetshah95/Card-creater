import { useCallback, useRef } from "react";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type BurstOptions = {
  colors?: string[];
  /** If true, skip particles entirely. */
  disabled?: boolean;
  count?: number;
};

export function useConfettiBurst(defaultColors: string[]) {
  const rootRef = useRef<HTMLDivElement>(null);

  const burst = useCallback(
    (opts?: BurstOptions) => {
      if (opts?.disabled) return;
      const root = rootRef.current;
      if (!root) return;

      const colors = opts?.colors?.length ? opts.colors : defaultColors;
      const count = opts?.count ?? 32;

      for (let i = 0; i < count; i++) {
        const bit = document.createElement("span");
        bit.className = "confetti__bit";
        bit.style.left = `${Math.random() * 100}%`;
        bit.style.background = pick(colors);
        bit.style.animationDuration = `${2.5 + Math.random() * 2}s`;
        bit.style.animationDelay = `${Math.random() * 0.35}s`;
        root.appendChild(bit);
        window.setTimeout(() => bit.remove(), 5500);
      }
    },
    [defaultColors],
  );

  return { rootRef, burst };
}
