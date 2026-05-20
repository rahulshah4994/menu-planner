// Shared types for the planner board + slot editor.

export type Slot = "Breakfast" | "Lunch" | "Dinner";
export const SLOTS: Slot[] = ["Breakfast", "Lunch", "Dinner"];

export type AddonCategory = "Beverage" | "Side" | "Salad" | "Dessert";
export const ADDON_CATS: readonly AddonCategory[] = [
  "Beverage",
  "Side",
  "Salad",
  "Dessert",
];

export interface MealLite {
  id: string;
  name_en: string;
  name_hi: string;
}

export interface AddonLite {
  id: string;
  name_en: string;
  name_hi: string;
  category: AddonCategory;
}

export interface PlanState {
  meals: MealLite[];
  addons: AddonLite[];
  eating_out: boolean;
  guests: number;
  today_note: string | null;
}
