/** Main color families */
export type ColorVariantKey = "green" | "blue" | "purple" | "red" | "orange" | "yellow";
export type ColorFamilyMember = "c1" | "c2" | "tint" | "text" | `stop${number}`;
export type ColorVariable = `${ColorVariantKey}-${ColorFamilyMember}`;

export const COLOR_ORDER: ColorVariantKey[] = ["green", "blue", "purple", "red", "orange", "yellow"];
export const NUMCOLORS: number = COLOR_ORDER.length;

/** Tailwind classes for the parts of a component that carry a variant's color. */
export interface ColorVariantClasses {
  /** Card left edges. */
  railY: string;
  /** Horizontal rail, left to right. Used in the calendarCalendar. */
  railX: string;
  /** Logo platecolored top edge and initials. */
  plate: string;
  /** Tag chip: pale fill, AA-safe text, solid border. */
  chip: string;
  /** Flat primary fill. Header stripe. */
  fill: string;
}

/**
 * Written out per variant rather than built from a template, because Tailwind
 * only emits a utility it can find as a literal string in the source. The
 * `--color-<key>-*` variables in index.css remain the single source of truth for
 * the actual color values; these are just the utilities that reference them.
 */
export const COLOR_CLASSES: Record<ColorVariantKey, ColorVariantClasses> = {
  green: {
    railY: "bg-linear-to-b from-green-c1 to-green-c2",
    railX: "bg-linear-to-r from-green-c1 to-green-c2",
    plate: "bg-linear-to-b from-green-tint to-surface-alt border-t-[3px] border-green-c1 text-green-c1",
    chip: "bg-green-tint text-green-text border border-green-c1",
    fill: "bg-green-c1",
  },
  blue: {
    railY: "bg-linear-to-b from-blue-c1 to-blue-c2",
    railX: "bg-linear-to-r from-blue-c1 to-blue-c2",
    plate: "bg-linear-to-b from-blue-tint to-surface-alt border-t-[3px] border-blue-c1 text-blue-c1",
    chip: "bg-blue-tint text-blue-text border border-blue-c1",
    fill: "bg-blue-c1",
  },
  purple: {
    railY: "bg-linear-to-b from-purple-c1 to-purple-c2",
    railX: "bg-linear-to-r from-purple-c1 to-purple-c2",
    plate: "bg-linear-to-b from-purple-tint to-surface-alt border-t-[3px] border-purple-c1 text-purple-c1",
    chip: "bg-purple-tint text-purple-text border border-purple-c1",
    fill: "bg-purple-c1",
  },
  red: {
    railY: "bg-linear-to-b from-red-c1 to-red-c2",
    railX: "bg-linear-to-r from-red-c1 to-red-c2",
    plate: "bg-linear-to-b from-red-tint to-surface-alt border-t-[3px] border-red-c1 text-red-c1",
    chip: "bg-red-tint text-red-text border border-red-c1",
    fill: "bg-red-c1",
  },
  orange: {
    railY: "bg-linear-to-b from-orange-c1 to-orange-c2",
    railX: "bg-linear-to-r from-orange-c1 to-orange-c2",
    plate: "bg-linear-to-b from-orange-tint to-surface-alt border-t-[3px] border-orange-c1 text-orange-c1",
    chip: "bg-orange-tint text-orange-text border border-orange-c1",
    fill: "bg-orange-c1",
  },
  yellow: {
    railY: "bg-linear-to-b from-yellow-c1 to-yellow-c2",
    railX: "bg-linear-to-r from-yellow-c1 to-yellow-c2",
    plate: "bg-linear-to-b from-yellow-tint to-surface-alt border-t-[3px] border-yellow-c1 text-yellow-c1",
    chip: "bg-yellow-tint text-yellow-text border border-yellow-c1",
    fill: "bg-yellow-c1",
  },
};

export function colorKey(idx: number): ColorVariantKey {
  return COLOR_ORDER[idx % COLOR_ORDER.length];
}

export function classesForID(id: number): ColorVariantClasses {
  const idx = id % NUMCOLORS;
  return COLOR_CLASSES[colorKey(idx < 0 ? 0 : idx)];
}

export function accentGradient(color: ColorVariantKey | number = "purple"): string {
  const c = (typeof color === "number") ? colorKey(color) : color;
  return `bg-linear-135 from-${c}-c1 to-${c}-c2`
}

export function accentStops(color: ColorVariantKey | number): `bg-${ColorVariable}`[] {
  const c = (typeof color === "number") ? colorKey(color) : color;
  return [
    `bg-${c}-c1`,
    `bg-${c}-stop2`,
    `bg-${c}-stop3`,
    `bg-${c}-c2`
  ]
}
