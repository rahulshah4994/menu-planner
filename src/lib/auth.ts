import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Asserts the request is from an authenticated user who belongs to a family.
 * Sends users without a family to onboarding (create or join one).
 * Returns the user, a server supabase client, and the caller's family id.
 */
export async function requireFamily() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: fam } = await supabase
    .from("family_users")
    .select("family_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!fam?.family_id) redirect("/onboarding");

  return { user, supabase, familyId: fam.family_id as string };
}
