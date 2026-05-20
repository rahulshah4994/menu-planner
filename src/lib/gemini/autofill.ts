import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Swap here if Google rolls a newer flash-lite model.
const MODEL = "gemini-2.5-flash-lite";

function client() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export interface DishAutofill {
  name_hi: string;
  ingredients: string[];
  ingredients_hi: string[];
}

export interface MealAutofill {
  name_hi: string;
  dishes: string[];
}

const DISH_SYSTEM = `You are an Indian-cuisine expert helping a family fill out their meal-planning database.

Given an English dish name and category, return:
1. name_hi: The Hindi name in Devanagari (e.g., "राजमा" for Rajma).
2. ingredients: A SHORT list of ONLY the main ingredients in English (typically 2–5) — the proteins, vegetables, grains, and dairy that drive a weekly grocery shop.
3. ingredients_hi: The SAME ingredients written in Hindi Devanagari, index-for-index (same length, same order).

STRICT EXCLUSIONS — DO NOT INCLUDE:
- Spices (turmeric, cumin, garam masala, red chilli, coriander powder, hing, mustard seeds, cardamom, etc.)
- Condiments / aromatics (salt, sugar, ginger, garlic, green chilli, curry leaves, fresh coriander)
- Cooking oil / ghee (unless the oil itself is the star, e.g., mustard oil for a fish curry)
- Water, lemon juice, garnish herbs

English ingredients in Title Case (e.g., "Kidney Beans", "Paneer", "Atta", "Basmati Rice").
Hindi ingredients in standard Devanagari spelling (e.g., "राजमा", "पनीर", "आटा").

Examples:
- Aloo Paratha → ingredients: ["Atta", "Potato"], ingredients_hi: ["आटा", "आलू"]
- Rajma → ingredients: ["Kidney Beans", "Onion", "Tomato"], ingredients_hi: ["राजमा", "प्याज", "टमाटर"]
- Paneer Butter Masala → ingredients: ["Paneer", "Tomato", "Cream"], ingredients_hi: ["पनीर", "टमाटर", "क्रीम"]
- Idli Sambar → ingredients: ["Idli Batter", "Toor Dal", "Drumstick"], ingredients_hi: ["इडली बैटर", "तुअर दाल", "सहजन"]
- Masala Chai → ingredients: ["Milk", "Tea Leaves"], ingredients_hi: ["दूध", "चायपत्ती"]
- Gulab Jamun → ingredients: ["Khoya"], ingredients_hi: ["खोया"]`;

const MEAL_SYSTEM = `You are an Indian-cuisine expert helping a family fill out their meal-planning database.

A "meal" is a combination of dishes typically eaten together (e.g., "Rajma Rice" = Rajma + Rice + Raita).

Given an English meal name and meal type, return:
1. The Hindi name in Devanagari (e.g., "राजमा चावल" for Rajma Rice).
2. A list of the constituent dish names in English Title Case. Include side dishes that are conventionally served together (raita, salad, papad, etc.) when culturally expected. 2-6 dishes typical. Use canonical short names ("Rice" not "Steamed Basmati Rice", "Rajma" not "Kidney Bean Curry").`;

export async function autofillDish(
  name_en: string,
  category: string
): Promise<DishAutofill> {
  const model = client().getGenerativeModel({
    model: MODEL,
    systemInstruction: DISH_SYSTEM,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          name_hi: { type: SchemaType.STRING },
          ingredients: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          ingredients_hi: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["name_hi", "ingredients", "ingredients_hi"],
      },
    },
  });

  const result = await model.generateContent(
    `Dish: ${name_en}\nCategory: ${category}`
  );
  const parsed = JSON.parse(result.response.text());
  return {
    name_hi: String(parsed.name_hi),
    ingredients: parsed.ingredients ?? [],
    ingredients_hi: parsed.ingredients_hi ?? [],
  };
}

export async function autofillMeal(
  name_en: string,
  meal_type: string
): Promise<MealAutofill> {
  const model = client().getGenerativeModel({
    model: MODEL,
    systemInstruction: MEAL_SYSTEM,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          name_hi: { type: SchemaType.STRING },
          dishes: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["name_hi", "dishes"],
      },
    },
  });

  const result = await model.generateContent(
    `Meal: ${name_en}\nType: ${meal_type}`
  );
  const parsed = JSON.parse(result.response.text());
  return {
    name_hi: String(parsed.name_hi),
    dishes: parsed.dishes ?? [],
  };
}
