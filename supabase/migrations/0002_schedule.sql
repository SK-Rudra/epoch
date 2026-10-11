-- Weekly schedule: one row per user, shape validated by src/lib/schedule.ts.
create table schedule (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on schedule for each row execute function set_updated_at();
alter table schedule enable row level security;
create policy owner_all on schedule for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
