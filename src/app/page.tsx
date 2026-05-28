import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (!configured) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">🥗 Menu Planner</h1>
        <section className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <p className="font-semibold">⚠ Setup pending</p>
          <p className="mt-1">
            Copy{" "}
            <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> and
            fill in your Supabase URL + anon key + service role key + Gemini
            API key. See README.
          </p>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged in → straight into the app
  if (user) redirect("/v2/planner");

  // Logged out → login page
  redirect("/login");
}
