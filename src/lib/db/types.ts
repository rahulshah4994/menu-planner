// Hand-maintained types matching supabase/migrations/0001_init.sql.
// Once you have the Supabase CLI installed, you can regenerate via:
//   npx supabase gen types typescript --project-id YOUR_REF > src/lib/db/types.ts

export type DishCategory =
  | "Component"
  | "Bread"
  | "Grain"
  | "Snack"
  | "Beverage"
  | "Side"
  | "Salad"
  | "Dessert";
export type MealType = "Breakfast" | "Lunch" | "Evening Snack" | "Dinner";
export type Season = "Summer" | "Winter" | "All";

export interface Dish {
  id: string;
  name_en: string;
  name_hi: string;
  category: DishCategory;
  ingredients: string;
  ingredients_hi: string;
  recipe_url: string | null;
  cuisine: string | null;
  tags: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  name_en: string;
  name_hi: string;
  meal_type: MealType;
  weight: number;
  cuisine: string | null;
  tags: string;
  effort: number | null;
  season: Season;
  guest_worthy: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealDish {
  meal_id: string;
  dish_id: string;
  position: number;
}

export interface MealPlan {
  id: string;
  date: string;
  slot: MealType;
  eating_out: boolean;
  guests: number;
  today_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealPlanMeal {
  meal_plan_id: string;
  meal_id: string;
  position: number;
}

export interface MealPlanAddon {
  meal_plan_id: string;
  dish_id: string;
}

export interface FamilyUser {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface CookToken {
  token: string;
  label: string | null;
  revoked: boolean;
  created_at: string;
}

export interface Settings {
  id: 1;
  planning_horizon_days: number;
  viewer_horizon_days: number;
  deadline_time: string;
  household_size: number;
  no_repeat_days_breakfast: number;
  no_repeat_days_lunch: number;
  no_repeat_days_evening_snack: number;
  no_repeat_days_dinner: number;
  updated_at: string;
}

type DishInsert = Omit<Partial<Dish>, "name_en" | "name_hi" | "category"> & {
  name_en: string;
  name_hi: string;
  category: DishCategory;
};
type MealInsert = Omit<Partial<Meal>, "name_en" | "name_hi" | "meal_type"> & {
  name_en: string;
  name_hi: string;
  meal_type: MealType;
};
type MealPlanInsert = Omit<Partial<MealPlan>, "date" | "slot"> & {
  date: string;
  slot: MealType;
};

type GeneratedCols = "id" | "created_at" | "updated_at";

export interface Database {
  public: {
    Tables: {
      dishes: {
        Row: Dish;
        Insert: DishInsert;
        Update: Partial<Omit<Dish, GeneratedCols>>;
        Relationships: [];
      };
      meals: {
        Row: Meal;
        Insert: MealInsert;
        Update: Partial<Omit<Meal, GeneratedCols>>;
        Relationships: [];
      };
      meal_dishes: {
        Row: MealDish;
        Insert: MealDish;
        Update: Partial<MealDish>;
        Relationships: [];
      };
      meal_plans: {
        Row: MealPlan;
        Insert: MealPlanInsert;
        Update: Partial<Omit<MealPlan, GeneratedCols>>;
        Relationships: [];
      };
      meal_plan_meals: {
        Row: MealPlanMeal;
        Insert: MealPlanMeal;
        Update: Partial<MealPlanMeal>;
        Relationships: [];
      };
      meal_plan_addons: {
        Row: MealPlanAddon;
        Insert: MealPlanAddon;
        Update: Partial<MealPlanAddon>;
        Relationships: [];
      };
      family_users: {
        Row: FamilyUser;
        Insert: Omit<Partial<FamilyUser>, "id" | "email"> & {
          id: string;
          email: string;
        };
        Update: Partial<FamilyUser>;
        Relationships: [];
      };
      cook_tokens: {
        Row: CookToken;
        Insert: Omit<Partial<CookToken>, "token"> & { token: string };
        Update: Partial<CookToken>;
        Relationships: [];
      };
      settings: {
        Row: Settings;
        Insert: Partial<Settings>;
        Update: Partial<Settings>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      dish_category: DishCategory;
      meal_type: MealType;
      season_type: Season;
    };
    CompositeTypes: Record<never, never>;
  };
}
