import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash-lite";

function client() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export interface FoodAutofill {
  name_hi: string;
  ingredients: string;
  ingredients_hi: string;
}

const SYSTEM = `You are an Indian-cuisine expert helping a family fill out their meal-planning database.

You will be given:
- An English food name (always).
- Optional categories (e.g., Breakfast, Lunch, Snack) for context.
- The user's existing English ingredients (comma-separated) if any.
- The user's existing Hindi ingredients (comma-separated) if any.

Return three fields:
1. name_hi: The Hindi name in Devanagari (e.g., "राजमा चावल" for Rajma Chawal).
2. ingredients: SHORT comma-separated list of the main English ingredients in Title Case (2–5 items). If the user already provided English ingredients, REPRODUCE them exactly. Otherwise, generate the canonical short list.
3. ingredients_hi: The SAME ingredients in Hindi Devanagari, in the SAME order as the English list. If the user already provided Hindi ingredients, REPRODUCE them exactly.

STRICT EXCLUSIONS when generating ingredients — DO NOT INCLUDE:
- Spices (turmeric, cumin, garam masala, red chilli, coriander powder, hing, mustard seeds, cardamom, etc.)
- Condiments / aromatics (salt, sugar, ginger, garlic, green chilli, curry leaves, fresh coriander)
- Cooking oil / ghee (unless the oil itself is the star, e.g., mustard oil for a fish curry)
- Water, lemon juice, garnish herbs

Examples:
- Aloo Paratha → ingredients: "Atta, Potato", ingredients_hi: "आटा, आलू"
- Rajma → ingredients: "Kidney Beans, Onion, Tomato", ingredients_hi: "राजमा, प्याज, टमाटर"
- Masala Chai → ingredients: "Milk, Tea Leaves", ingredients_hi: "दूध, चायपत्ती"`;

/** Translate / generate the Hindi name and Hindi ingredients for a food row.
 *  If english ingredients are provided they are reproduced as-is; otherwise a
 *  canonical short list is generated. Hindi follows the English index-for-index. */
export async function autofillFoodHindi(input: {
  name_en: string;
  categories: string[];
  ingredients_en: string;
  ingredients_hi: string;
}): Promise<FoodAutofill> {
  const model = client().getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          name_hi: { type: SchemaType.STRING },
          ingredients: { type: SchemaType.STRING },
          ingredients_hi: { type: SchemaType.STRING },
        },
        required: ["name_hi", "ingredients", "ingredients_hi"],
      },
    },
  });

  const parts = [
    `Food (English): ${input.name_en}`,
    `Categories: ${input.categories.join(", ") || "(none)"}`,
    `Ingredients (English, user-provided): ${input.ingredients_en || "(none)"}`,
    `Ingredients (Hindi, user-provided): ${input.ingredients_hi || "(none)"}`,
  ].join("\n");

  let result;
  for (let attempt = 0; ; attempt++) {
    try {
      result = await model.generateContent(parts);
      break;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const is429 = msg.includes("429") || msg.toLowerCase().includes("quota");
      if (!is429 || attempt >= 4) throw e;
      // Exponential backoff: 2s, 4s, 8s, 16s
      await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
    }
  }
  const parsed = JSON.parse(result.response.text());
  return {
    name_hi: String(parsed.name_hi ?? "").trim(),
    ingredients: String(parsed.ingredients ?? "").trim(),
    ingredients_hi: String(parsed.ingredients_hi ?? "").trim(),
  };
}
