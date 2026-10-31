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
  /** Four fills stepping c1 -> c2, for the segmented modal top edge. */
  stops: string[];
  /** Diagonal c1 -> c2 fill. Primary buttons, toggles. */
  accent: string;
}

export const COLOR_CLASSES: Record<ColorVariantKey, ColorVariantClasses> = {
  green: {
    railY: "bg-linear-to-b from-green-c1 to-green-c2",
    railX: "bg-linear-to-r from-green-c1 to-green-c2",
    plate: "bg-linear-to-b from-green-tint to-surface-alt border-t-[3px] border-green-c1 text-green-c1",
    chip: "bg-green-tint text-green-text border border-green-c1",
    fill: "bg-green-c1",
    stops: ["bg-green-c1", "bg-green-stop2", "bg-green-stop3", "bg-green-c2"],
    accent: "bg-linear-135 from-green-c1 to-green-c2",
  },
  blue: {
    railY: "bg-linear-to-b from-blue-c1 to-blue-c2",
    railX: "bg-linear-to-r from-blue-c1 to-blue-c2",
    plate: "bg-linear-to-b from-blue-tint to-surface-alt border-t-[3px] border-blue-c1 text-blue-c1",
    chip: "bg-blue-tint text-blue-text border border-blue-c1",
    fill: "bg-blue-c1",
    stops: ["bg-blue-c1", "bg-blue-stop2", "bg-blue-stop3", "bg-blue-c2"],
    accent: "bg-linear-135 from-blue-c1 to-blue-c2",
  },
  purple: {
    railY: "bg-linear-to-b from-purple-c1 to-purple-c2",
    railX: "bg-linear-to-r from-purple-c1 to-purple-c2",
    plate: "bg-linear-to-b from-purple-tint to-surface-alt border-t-[3px] border-purple-c1 text-purple-c1",
    chip: "bg-purple-tint text-purple-text border border-purple-c1",
    fill: "bg-purple-c1",
    stops: ["bg-purple-c1", "bg-purple-stop2", "bg-purple-stop3", "bg-purple-c2"],
    accent: "bg-linear-135 from-purple-c1 to-purple-c2",
  },
  red: {
    railY: "bg-linear-to-b from-red-c1 to-red-c2",
    railX: "bg-linear-to-r from-red-c1 to-red-c2",
    plate: "bg-linear-to-b from-red-tint to-surface-alt border-t-[3px] border-red-c1 text-red-c1",
    chip: "bg-red-tint text-red-text border border-red-c1",
    fill: "bg-red-c1",
    stops: ["bg-red-c1", "bg-red-stop2", "bg-red-stop3", "bg-red-c2"],
    accent: "bg-linear-135 from-red-c1 to-red-c2",
  },
  orange: {
    railY: "bg-linear-to-b from-orange-c1 to-orange-c2",
    railX: "bg-linear-to-r from-orange-c1 to-orange-c2",
    plate: "bg-linear-to-b from-orange-tint to-surface-alt border-t-[3px] border-orange-c1 text-orange-c1",
    chip: "bg-orange-tint text-orange-text border border-orange-c1",
    fill: "bg-orange-c1",
    stops: ["bg-orange-c1", "bg-orange-stop2", "bg-orange-stop3", "bg-orange-c2"],
    accent: "bg-linear-135 from-orange-c1 to-orange-c2",
  },
  yellow: {
    railY: "bg-linear-to-b from-yellow-c1 to-yellow-c2",
    railX: "bg-linear-to-r from-yellow-c1 to-yellow-c2",
    plate: "bg-linear-to-b from-yellow-tint to-surface-alt border-t-[3px] border-yellow-c1 text-yellow-c1",
    chip: "bg-yellow-tint text-yellow-text border border-yellow-c1",
    fill: "bg-yellow-c1",
    stops: ["bg-yellow-c1", "bg-yellow-stop2", "bg-yellow-stop3", "bg-yellow-c2"],
    accent: "bg-linear-135 from-yellow-c1 to-yellow-c2",
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
  return COLOR_CLASSES[c].accent;
}

export function accentStops(color: ColorVariantKey | number): string[] {
  const c = (typeof color === "number") ? colorKey(color) : color;
  return COLOR_CLASSES[c].stops;
}
