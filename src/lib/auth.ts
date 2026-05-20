import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Asserts the request is from an authenticated family member.
 * Self-heals the family_users row if it's missing (e.g., first sign-in race).
 */
export async function requireFamily() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: fam } = await supabase
    .from("family_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!fam) {
    await supabase
      .from("family_users")
      .insert({ id: user.id, email: user.email! });
  }
  return { user, supabase };
}
