import { NextResponse } from "next/server";
import { z } from "zod";
import { autofillDish } from "@/lib/gemini/autofill";
import { createClient } from "@/lib/supabase/server";

const body = z.object({
  name_en: z.string().min(1).max(120),
  // Category is free text since migration 0005 (creatable on the dish form).
  category: z.string().min(1).max(60),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const out = await autofillDish(parsed.data.name_en, parsed.data.category);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
