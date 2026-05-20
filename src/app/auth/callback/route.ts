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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("family_users")
          .upsert(
            { id: user.id, email: user.email! },
            { onConflict: "id" }
          );
      }
      return NextResponse.redirect(`${url.origin}${next}`);
    }
  }
  return NextResponse.redirect(`${url.origin}/login?error=invalid_link`);
}
