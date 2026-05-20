import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL(req.url);
  return NextResponse.redirect(`${url.origin}/login`, { status: 303 });
}
