<div align="center">

# Epoch

**Train yourself. One epoch at a time.**

A private, single-user dashboard for following a 13-month career roadmap. You log each day, track every phase, and see whether the plan is on schedule.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)

</div>

---

## Overview

Epoch treats a long self-study plan like a model training run. The plan is split into six **epochs** (phases). Each epoch has a target role, a date range, and a set of skills, courses, projects and goals. The app shows where you are in the run, how much of each epoch is done, and how consistent your daily work has been.

It is built for exactly one person. Only one email address can sign in, sign-ups are disabled, and every table is protected by Postgres row-level security.

## Features

- **Run dashboard.** Current epoch, day *N* of the full run, a live run clock, a timeline of all six epochs, and overall progress.
- **Phase pages.** Skills, courses, projects and goals for each epoch. Tap an item to move it from not started to in progress to done, tick goals off, and open a project's live demo or repo when links are set.
- **Daily log.** Study hours, LeetCode problems solved, IELTS minutes, workout and a short note. Press `L` on any page to open it.
- **Study streak and uptime.** Counts consecutive days with study time, plus a 30-day uptime strip. Today doesn't count as a broken streak until the day is over.
- **LeetCode sync.** Pulls solved counts (easy, medium, hard), the submission calendar and recent accepted solves from a public LeetCode profile. A daily cron job runs it, or you can press **Sync now**.
- **Activity page.** Year-long study heatmap, hours per week, LeetCode progress against the target, and a submission heatmap.
- **Weekly review.** Wins, blockers, up to three priorities for next week, and a 1–5 mood score. Past weeks stay browsable.
- **Schedule.** A class-day and off-day timetable that highlights the block you're in right now.
- **Mobile first.** Designed at 400 px wide, with a bottom tab bar on phones, light and dark themes, and an installable PWA manifest.
- **Keyboard shortcuts.** `1`–`6` open an epoch, `L` logs today, `?` lists the shortcuts.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions, Cache Components) |
| UI | React 19, Tailwind CSS 4, [Motion](https://motion.dev), [Lucide](https://lucide.dev) icons, [Sonner](https://sonner.emilkowal.ski) toasts, `next-themes` |
| Data and auth | [Supabase](https://supabase.com) (Postgres, email and password auth, row-level security) |
| Validation | [Zod](https://zod.dev) for forms, the seed file, the stored schedule and LeetCode responses |
| Testing | [Vitest](https://vitest.dev) |
| Hosting | [Vercel](https://vercel.com), with Vercel Cron for the daily LeetCode sync |

## Project structure

```
epoch/
├── data/
│   └── roadmap-seed.json        # The roadmap: phases, skills, courses, projects, goals, schedule, targets
├── scripts/
│   ├── seed.ts                  # Loads the roadmap into Supabase and creates the login account
│   └── set-password.ts          # Sets or changes the sign-in password
├── supabase/
│   └── migrations/              # 0001_init, 0002_schedule, 0003_leetcode
├── src/
│   ├── proxy.ts                 # Redirects every page to /login unless signed in as the allowed email
│   ├── app/
│   │   ├── (app)/               # Signed-in pages: dashboard, activity, reviews, schedule, phases/[number]
│   │   ├── api/cron/leetcode/   # Daily LeetCode sync endpoint (protected by CRON_SECRET)
│   │   ├── login/               # Sign-in page and server action
│   │   └── manifest.ts          # PWA manifest
│   ├── components/              # Top bar, charts, progress bars, motion helpers, theme toggle
│   └── lib/                     # Pure logic (progress, streaks, dates, schedule, activity) + Supabase clients
└── vercel.json                  # Cron schedule
```

## Data model

All tables have a `user_id` column that defaults to `auth.uid()`, and an `owner_all` RLS policy so rows are visible only to their owner.

| Table | Purpose |
| --- | --- |
| `phases` | The six epochs: number, title, role, start and end dates, summary |
| `skills`, `courses`, `projects` | Items in a phase, each with a `not_started` / `in_progress` / `done` status |
| `goals` | Checkbox goals for a phase |
| `daily_logs` | One row per day: study hours, LeetCode solved, workout, IELTS minutes, note |
| `weekly_reviews` | One row per Sunday-start week: wins, blockers, up to 3 priorities, mood (1–5) |
| `schedule` | The weekly timetable as validated JSON, one row per user |
| `leetcode_snapshots` | One snapshot per day: totals by difficulty, submission calendar, recent solves |

Phase progress is `done items / (skills + courses + projects + goals)`, rounded down so 100% only appears when everything is finished. Overall progress uses the same formula across every item in every phase rather than averaging the phase percentages.

## Getting started

### Prerequisites

- Node.js (current LTS) and npm
- A free [Supabase](https://supabase.com/dashboard) project
- A public LeetCode username (optional, only needed for the LeetCode features)

### 1. Clone and install

```bash
git clone https://github.com/SK-Rudra/epoch.git
cd epoch
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project.
2. Open the **SQL Editor** and run each migration in order:
   `supabase/migrations/0001_init.sql`, then `0002_schedule.sql`, then `0003_leetcode.sql`.
3. Go to **Authentication → Sign In / Providers → Email**. Keep Email enabled and turn **off** "Allow new users to sign up".

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL from **Project Settings → API** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | The `anon` key. Safe for the browser because RLS protects the data |
| `ALLOWED_EMAIL` | Yes | The only email allowed to sign in |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Secret.** Bypasses RLS. Used by the seed script, the password script and the cron job. Never prefix it with `NEXT_PUBLIC_` |
| `LEETCODE_USERNAME` | For LeetCode | The username in `leetcode.com/u/<username>` |
| `CRON_SECRET` | For the cron job | **Secret.** Random string that Vercel Cron sends as a bearer token |

To generate a `CRON_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Seed the roadmap

```bash
npm run seed
```

This loads `data/roadmap-seed.json` and creates your login account. You can run it again safely: it updates rows in place and never resets statuses, checked goals, or project links and notes already stored in the database. To load a different file, run `npm run seed -- path/to/file.json`.

### 5. Set your password

```bash
npm run set-password
```

Type a password (at least 5 characters). It isn't echoed or stored on your machine. Run the command again whenever you want to change it.

### 6. Run the app

```bash
npm run dev
```

Open <http://localhost:3000>. You'll be sent to `/login`, where you sign in with your email and password.

## Deployment

1. Import the repository into Vercel.
2. Add every variable from the table above under **Project Settings → Environment Variables**. `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` are server-only.
3. Deploy. Vercel picks up the cron job from `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/leetcode", "schedule": "0 17 * * *" }] }
```

17:00 UTC is 23:00 in Dhaka. Even with the Hobby plan's timing window, the sync lands before local midnight, so each day's solves are counted on the right day.

## LeetCode sync

Epoch reads stats from `https://leetcode.com/graphql`, the same public endpoint LeetCode's website uses. It needs no login, but it is **undocumented** and could change without notice. To keep that risk contained:

- All code that knows the response shape lives in `src/lib/leetcode.ts`, and every response is validated with Zod before it's used.
- If a sync fails, the app keeps showing the last saved snapshot and displays a warning.
- One snapshot is stored per Dhaka day. Syncing again on the same day updates that row.
- LeetCode is called at most once every 10 minutes. The saved snapshot works as the cache.
- Today's `leetcode_solved` in the daily log is filled in automatically (today's total minus the previous snapshot). If you type the number yourself, the sync leaves it alone.

## Security model

- **Email allowlist.** The login server action rejects any email other than `ALLOWED_EMAIL`, and with sign-ups disabled no other account can exist. Every failure returns the same "Wrong email or password." message. If `ALLOWED_EMAIL` is missing, nobody can sign in.
- **Two layers of route protection.** `src/proxy.ts` redirects all pages to `/login` unless the session belongs to the allowed email, and each page checks again with `requireUser()`.
- **Row-level security** on every table: rows can be read or written only when `user_id = auth.uid()`.
- **Service role key stays on the server.** `src/lib/supabase/admin.ts` imports `server-only`, so the build fails if a Client Component imports it. `next.config.ts` also stops the build if any `NEXT_PUBLIC_` variable contains the service role key.
- **Cron endpoint.** `/api/cron/leetcode` accepts only `Authorization: Bearer <CRON_SECRET>`, compares it in constant time, and refuses all requests if the secret isn't set.

## Customizing the roadmap

Everything in the plan comes from `data/roadmap-seed.json`:

- `phases`: six phases with titles, roles, dates, summaries, skills, courses, projects and goals
- `schedule`: class days, off days and the time blocks for each kind of day
- `targets`: goal numbers such as the total LeetCode problems to solve

Edit the file and run `npm run seed` to apply your changes. All dates in the app use the `Asia/Dhaka` time zone (see `src/lib/dates.ts`).

The roadmap shipped in this repo:

| Epoch | Title | Dates |
| --- | --- | --- |
| E1 | Python Developer & Problem Solver | Oct 2026 – Nov 2026 |
| E2 | Backend Developer | Dec 2026 – Jan 2027 |
| E3 | Machine Learning Engineer | Feb 2027 – Mar 2027 |
| E4 | NLP / LLM Engineer | Apr 2027 – May 2027 |
| E5 | AI Engineer in Production | Jun 2027 – Jul 2027 |
| E6 | Job-Ready AI/ML Engineer | Aug 2027 – Oct 2027 |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite |
| `npm run typecheck` | Generate Next.js route types, then run `tsc --noEmit` |
| `npm run seed` | Load the roadmap and schedule into Supabase |
| `npm run set-password` | Set or change the sign-in password |

## Testing

The calculations live in `src/lib/` as pure functions, so they can be tested without a database or a browser. The Vitest suite covers progress percentages, streaks, the run timeline and log lines, activity charts, schedule lookup, LeetCode response parsing and the email allowlist.

```bash
npm test
```

## Author

**SK Rudra** · [@SK-Rudra](https://github.com/SK-Rudra)

## License

No license has been chosen yet, so all rights are reserved by default. Open an issue if you'd like to reuse part of the code.
