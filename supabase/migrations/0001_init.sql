-- Epoch: initial schema. Every table is owned by one user and locked down with RLS.

create type item_status as enum ('not_started', 'in_progress', 'done');

-- Keeps updated_at fresh on every UPDATE.
create function set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table phases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  number int not null check (number between 1 and 6),
  title text not null,
  role_name text not null default '',
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  summary text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, number)
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  phase_id uuid not null references phases on delete cascade,
  main_skill text not null,
  sub_skills text not null default '',
  status item_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, main_skill)
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  phase_id uuid not null references phases on delete cascade,
  name text not null,
  provider text not null default '',
  url text not null default '',
  time_slot text not null default '',
  status item_status not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, name)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  phase_id uuid not null references phases on delete cascade,
  rank int not null check (rank > 0),
  name text not null,
  problem_solved text not null default '',
  stack text not null default '',
  status item_status not null default 'not_started',
  live_url text not null default '',
  repo_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, rank)
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  phase_id uuid not null references phases on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phase_id, text)
);

create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  study_hours numeric(4, 2) not null default 0 check (study_hours between 0 and 24),
  leetcode_solved int not null default 0 check (leetcode_solved >= 0),
  workout boolean not null default false,
  ielts_minutes int not null default 0 check (ielts_minutes >= 0),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_start date not null check (extract(dow from week_start) = 0), -- weeks start on Sunday
  wins text not null default '',
  blockers text not null default '',
  next_week_priorities text[] not null default '{}' check (cardinality(next_week_priorities) <= 3),
  mood int not null check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- Same trigger + RLS policy + user_id index on every table.
do $$
declare t text;
begin
  foreach t in array array['phases','skills','courses','projects','goals','daily_logs','weekly_reviews'] loop
    execute format('create trigger set_updated_at before update on %I for each row execute function set_updated_at()', t);
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy owner_all on %I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create index on %I (user_id)', t);
  end loop;
end $$;

create index on skills (phase_id);
create index on courses (phase_id);
create index on projects (phase_id);
create index on goals (phase_id);
