// Types for the parallel day-plan model.

export interface Food {
  id: string;
  name: string;
  name_hi: string;
  categories: string[];
  ingredients: string;
  ingredients_hi: string;
  recipe_url: string | null;
  weight: number;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlotTemplate {
  id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

export interface DayPlan {
  id: number;
  plan_date: string;
  created_at: string;
}

export interface DaySlot {
  id: number;
  day_plan_id: number;
  slot_no: number;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

export type FoodLite = Pick<Food, "id" | "name" | "name_hi" | "categories">;

/** A slot plus the foods placed in it — the shape the planner UI consumes. */
export interface SlotWithFoods extends DaySlot {
  foods: FoodLite[];
}
