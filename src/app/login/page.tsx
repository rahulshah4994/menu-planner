import { signInMagicLink, signInPassword } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-black">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Family members only. Use either method below.
      </p>

      {error && (
        <p className="mt-6 border border-black bg-zinc-50 px-3 py-2 text-sm text-black">
          {prettyError(error)}
        </p>
      )}

      <form className="mt-8 space-y-4">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-700">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="input mt-1"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-700">
            Password{" "}
            <span className="font-normal normal-case text-zinc-400">
              (optional — leave blank for magic link)
            </span>
          </span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            className="input mt-1"
          />
        </label>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <button
            type="submit"
            formAction={signInPassword}
            className="btn btn-primary flex-1 justify-center"
          >
            Sign in with password
          </button>
          <button
            type="submit"
            formAction={signInMagicLink}
            className="btn btn-secondary flex-1 justify-center"
          >
            Send magic link
          </button>
        </div>
      </form>

      <details className="mt-10 border border-zinc-200 p-3 text-xs text-zinc-600">
        <summary className="cursor-pointer font-medium text-zinc-900">
          How do I set a password?
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Open the Supabase dashboard →{" "}
            <strong>Authentication → Users</strong>
          </li>
          <li>
            Find your row (or click <strong>Add user</strong> if you don&apos;t
            have one yet)
          </li>
          <li>
            Click the ⋯ menu → <strong>Send password recovery</strong>, then
            click the link in the email
          </li>
          <li>
            Or with the user open, click <strong>Update password</strong> and
            set one directly
          </li>
        </ol>
      </details>
    </main>
  );
}

function prettyError(msg: string) {
  if (msg.toLowerCase().includes("rate limit")) {
    return "Email rate limit hit. Use the password option, wait an hour, or set up custom SMTP in Supabase.";
  }
  if (msg.toLowerCase().includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  return msg;
}
