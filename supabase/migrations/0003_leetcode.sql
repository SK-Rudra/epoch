-- LeetCode stats: one snapshot per Asia/Dhaka day, written by src/lib/leetcode-sync.ts
-- (the daily cron or the dashboard's "Sync now"). Syncing again on the same day updates that day's row.
create table leetcode_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  total int not null check (total >= 0),
  easy int not null check (easy >= 0),
  medium int not null check (medium >= 0),
  hard int not null check (hard >= 0),
  calendar jsonb not null default '{}', -- submissions per UTC day, past year: {"YYYY-MM-DD": n}
  recent jsonb not null default '[]',   -- latest accepted solves: [{"title", "slug", "at"}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), -- time of the last successful sync for this day
  unique (user_id, date) -- also serves as the user_id index
);

create trigger set_updated_at before update on leetcode_snapshots for each row execute function set_updated_at();
alter table leetcode_snapshots enable row level security;
create policy owner_all on leetcode_snapshots for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- true once you type a LeetCode count for a day yourself; syncing then leaves that day's number alone.
alter table daily_logs add column leetcode_manual boolean not null default false;
