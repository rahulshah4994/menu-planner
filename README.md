# Menu Planner

A family meal-planning web app:

- **Family** picks meals via the Selector (English, magic-link login).
- **Cook** sees a read-only view in Hindi (Devanagari) at a bookmark-able secret URL.
- A weighted randomiser fills the 4 daily slots (Breakfast / Lunch / Evening Snack / Dinner) with per-category no-repeat rules.
- Add-ons (Beverage / Side / Salad / Dessert) attach to any slot.
- Grocery list auto-aggregates ingredient names across the week; you fill quantities.
- ✨ Gemini Flash Lite auto-fills Hindi names + ingredients when adding new items.

Stack: **Next.js 16 + Supabase + Vercel + Gemini Flash Lite**.

---

## First-time setup

### 1. Install deps

```bash
cd menu-planner
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com> → New Project.
2. Once provisioned, open **SQL Editor** and paste the contents of `supabase/migrations/0001_init.sql`. Run it.
3. (Optional) Run `supabase/seed.sql` for a few sample dishes/meals.
4. Open **Project Settings → API**. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose)
5. Open **Authentication → Providers** → enable **Email** (magic link is on by default). Disable "Confirm email" for fast dev signups (re-enable for prod).

### 3. Get a Gemini API key

Go to <https://aistudio.google.com/app/apikey> → Create API key. Copy to `GEMINI_API_KEY`.

### 4. Configure env

```bash
cp .env.example .env.local
# Edit .env.local and paste the four keys
openssl rand -hex 32  # use this output as CRON_SECRET
```

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>. You should see "Supabase configured ✓".

---

## Project layout

```
src/
  app/                    Next.js App Router (Next 16)
    api/                  API routes (Gemini auto-fill, cron)
  lib/
    supabase/             Browser + server + proxy Supabase clients
    db/types.ts           Hand-maintained DB types (regenerate via supabase CLI)
    randomiser/           Weighted no-repeat picker
    gemini/               LLM auto-fill helpers
  components/             Shared UI
  proxy.ts                Refreshes auth session per request (renamed from middleware in Next 16)
supabase/
  migrations/0001_init.sql  Full schema (run in Supabase SQL Editor)
  seed.sql                  Optional sample data
```

## Next.js 16 notes

- **`proxy.ts`** replaces `middleware.ts` (functional equivalent, just renamed).
- `cookies()`, `headers()`, `params`, `searchParams` are all **async**.
- Turbopack is the dev default.

## Build order

See the task list in this Claude Code session for the sequenced build plan.
