import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createFamily, joinFamily } from "./actions";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already in a family — nothing to do here.
  const { data: existing } = await supabase
    .from("family_users")
    .select("family_id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing?.family_id) redirect("/");

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-black">
        Set up your family
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Your foods, plans, and settings are shared with everyone in your family.
        Start a new one, or join an existing family with its code.
      </p>

      {error && (
        <p className="mt-6 border border-black bg-zinc-50 px-3 py-2 text-sm text-black">
          {error}
        </p>
      )}

      <section className="mt-8 border border-zinc-200 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-black">
          Create a family
        </h2>
        <form action={createFamily} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-700">
              Family name
            </span>
            <input
              type="text"
              name="name"
              required
              placeholder="The Shah family"
              className="input mt-1"
            />
          </label>
          <button type="submit" className="btn btn-primary w-full justify-center">
            Create family
          </button>
        </form>
      </section>

      <section className="mt-6 border border-zinc-200 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-black">
          Join a family
        </h2>
        <form action={joinFamily} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-700">
              Join code
            </span>
            <input
              type="text"
              name="code"
              required
              autoCapitalize="characters"
              placeholder="ABC234"
              className="input mt-1 uppercase"
            />
          </label>
          <button
            type="submit"
            className="btn btn-secondary w-full justify-center"
          >
            Join family
          </button>
        </form>
      </section>
    </main>
  );
}
