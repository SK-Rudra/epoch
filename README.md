# Epoch

Train yourself. One epoch at a time.

Private, single-user personal development tracker. Next.js 16 (App Router) + Supabase + Vercel.

## Run locally

### 1. Create the Supabase project (one time)
1. Create a free project at <https://supabase.com/dashboard>.
2. **SQL Editor** → paste all of `supabase/migrations/0001_init.sql` → Run. Then do the same with `0002_schedule.sql`.
3. **Authentication → Sign In / Providers → Email**: keep Email enabled (password sign-in lives there), and turn **off** "Allow new users to sign up".

### 2. Environment
```bash
cp .env.example .env.local
```
Fill in from **Project Settings → API**: the project URL, the `anon` key, the `service_role` key, plus your `ALLOWED_EMAIL`.

### 3. Seed your roadmap
```bash
npm install
npm run seed
```
The seed also creates your (only) login account. Re-running it is safe: it updates rows in place and never resets statuses, checked goals, or project links/notes you added in the app. Your roadmap lives in `data/roadmap-seed.json`; edit it and re-run to update titles, dates, skills, etc.

### 4. Set your password
```bash
npm run set-password
```
Type a password (5+ characters) when asked; it isn't shown or saved anywhere on your computer. Run it again any time to change the password.

### 5. Start
```bash
npm run dev
```
Open <http://localhost:3000> → you're sent to `/login` → sign in with your email and password.

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm test` | Vitest |
| `npm run typecheck` | Generate Next route types + `tsc` |
| `npm run seed` | Load `data/roadmap-seed.json` (phases + schedule) (or `npm run seed -- path/to/file.json`) |
| `npm run set-password` | Set or change your sign-in password |

## How privacy works
- **Server-side allowlist**: the login server action rejects any email that isn't `ALLOWED_EMAIL`, and disabled sign-ups mean no other account can exist. Every failure shows the same "Wrong email or password." message.
- **`src/proxy.ts`** redirects every page to `/login` unless signed in as the allowed email; pages call `requireUser()` again as a second check.
- **RLS** on every table: rows are visible/editable only when `user_id = auth.uid()`.
- The browser only ever gets the anon key. `SUPABASE_SERVICE_ROLE_KEY` is used only by `scripts/seed.ts` and `scripts/set-password.ts` — never add it to Vercel.
