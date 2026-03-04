-- Warmchain schema — profiles + connector_profiles

-- Founder profiles
create table if not exists profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  user_type    text not null default 'founder',
  username     text unique not null,
  company_name text not null,
  one_liner    text,
  stage        text,
  traction     text,
  ask          text,
  team         text,
  links        text,
  created_at   timestamptz default now()
);

-- Connector profiles
create table if not exists connector_profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  user_type   text not null default 'connector',
  username    text unique not null,
  name        text not null,
  bio         text,
  expertise   text,
  helps_with  text,
  portfolio   text,
  links       text,
  created_at  timestamptz default now()
);

-- Indexes
create index on profiles(user_id);
create index on profiles(username);
create index on connector_profiles(user_id);
create index on connector_profiles(username);

-- Row Level Security
alter table profiles           enable row level security;
alter table connector_profiles enable row level security;

-- profiles policies
create policy "profiles_read_all" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_insert"   on profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update"   on profiles for update using (auth.uid() = user_id);
create policy "profiles_delete"   on profiles for delete using (auth.uid() = user_id);

-- connector_profiles policies
create policy "cp_read_all" on connector_profiles for select using (auth.role() = 'authenticated');
create policy "cp_insert"   on connector_profiles for insert with check (auth.uid() = user_id);
create policy "cp_update"   on connector_profiles for update using (auth.uid() = user_id);
create policy "cp_delete"   on connector_profiles for delete using (auth.uid() = user_id);
