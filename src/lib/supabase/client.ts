import { createBrowserClient } from "@supabase/ssr";

// Note: Database generic intentionally omitted. Regenerate types with
//   npx supabase gen types typescript --project-id $REF > src/lib/db/types.ts
// and add <Database> back once you have CLI-generated types.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
