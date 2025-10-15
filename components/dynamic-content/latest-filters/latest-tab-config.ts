import type { LucideIcon } from "lucide-react";
import { Grid3x3, Hammer, Wrench, GraduationCap, Sun, Wind } from "lucide-react";

export type MaterialKey = "tile" | "shingle" | "metal";
export type CategoryKey = "education" | "hurricane-preparation" | "energy-efficient-roofing";

export type TabConfig<Key extends string> = {
  key: Key;
  label: string;
  icon: LucideIcon;
};

export const PROJECT_TAB_CONFIG: Array<TabConfig<MaterialKey>> = [
  { key: "tile", label: "Tile", icon: Grid3x3 },
  { key: "shingle", label: "Shingle", icon: Hammer },
  { key: "metal", label: "Metal", icon: Wrench },
];

export const POST_TAB_CONFIG: Array<TabConfig<CategoryKey>> = [
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "hurricane-preparation", label: "Hurricane Preparation", icon: Wind },
  { key: "energy-efficient-roofing", label: "Energy-Efficient Roofing", icon: Sun },
];
