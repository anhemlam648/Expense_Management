-- Supabase schema for expense management frontend
-- Run this in the Supabase SQL editor or via migration scripts.

-- Enable pgcrypto if not already enabled (required for gen_random_uuid).
create extension if not exists pgcrypto;

-- Profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null,
  avatar_url text,
  wallet_balance numeric(12,2) default 0 not null,
  updated_at timestamp with time zone default now()
);

alter table profiles enable row level security;
create policy "Allow authenticated users to manage their own profile"
  on profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Categories table
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('EXPENSE', 'INCOME')),
  created_at timestamp with time zone default now()
);

alter table categories enable row level security;
create policy "Allow authenticated users to manage their own categories"
  on categories
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Transactions table
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references categories(id) on delete restrict,
  description text not null,
  amount numeric(12,2) not null,
  date date not null,
  note text,
  created_at timestamp with time zone default now()
);

alter table transactions enable row level security;
create policy "Allow authenticated users to manage their own transactions"
  on transactions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
