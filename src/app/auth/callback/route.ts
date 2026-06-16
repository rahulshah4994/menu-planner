import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Family membership is established in /onboarding; requireFamily() in the
      // (main) layout bounces a family-less user there.
      return NextResponse.redirect(`${url.origin}${next}`);
    }
  }
  return NextResponse.redirect(`${url.origin}/login?error=invalid_link`);
}
