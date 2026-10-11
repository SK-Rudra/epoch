# Epoch

Train yourself. One epoch at a time.

Private, single-user personal development tracker. Next.js 16 (App Router) + Supabase + Vercel.

## Run locally

### 1. Create the Supabase project (one time)
1. Create a free project at <https://supabase.com/dashboard>.
2. **SQL Editor** → paste all of `supabase/migrations/0001_init.sql` → Run.
3. **Authentication → Sign In / Providers → Email**: keep Email enabled, and turn **off** "Allow new users to sign up".
4. **Authentication → URL Configuration**: Site URL `http://localhost:3000`, and add `http://localhost:3000/auth/callback` to Redirect URLs.

### 2. Environment
```bash
cp .env.example .env.local
```
Fill in from **Project Settings → API**: the project URL, the `anon` key, the `service_role` key, plus your `ALLOWED_EMAIL`.

### 3. Seed your roadmap
```bash
cp seed/roadmap.example.json seed/roadmap.json   # then put your real roadmap in it
npm install
npm run seed
```
The seed also creates your (only) login account. Re-running it is safe: it updates rows in place and never resets statuses or checked goals.

### 4. Start
```bash
npm run dev
```
Open <http://localhost:3000> → you're sent to `/login` → enter your email → click the link in your inbox **in the same browser**.

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Vitest |
| `npm run typecheck` | Generate Next route types + `tsc` |
| `npm run seed` | Load `seed/roadmap.json` (or `npm run seed -- path/to/file.json`) |

## How privacy works
- **Server-side allowlist**: the login server action rejects any email that isn't `ALLOWED_EMAIL`; `shouldCreateUser: false` plus disabled sign-ups means no other account can exist.
- **`src/proxy.ts`** redirects every page to `/login` unless signed in as the allowed email; pages call `requireUser()` again as a second check.
- **RLS** on every table: rows are visible/editable only when `user_id = auth.uid()`.
- The browser only ever gets the anon key. `SUPABASE_SERVICE_ROLE_KEY` is used only by `scripts/seed.ts` — never add it to Vercel.
