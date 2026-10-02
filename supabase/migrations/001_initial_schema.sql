begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  avatar_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.planner_documents (
  user_id uuid not null references auth.users(id) on delete cascade,
  document_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, document_key),
  constraint planner_documents_key_check check (
    document_key in ('day', 'week', 'month', 'year_goals', 'focus')
  ),
  constraint planner_documents_payload_object_check check (
    jsonb_typeof(payload) = 'object'
  )
);

create table if not exists public.finance_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id text not null,
  type text not null,
  amount numeric(14, 2) not null,
  checked boolean not null default false,
  record_date text not null,
  month_key text,
  note text not null default '',
  title text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, record_id),
  constraint finance_records_type_check check (type in ('income', 'expense')),
  constraint finance_records_amount_check check (amount >= 0),
  constraint finance_records_month_key_check check (
    month_key is null or month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  )
);

create table if not exists public.savings_debt_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id text not null,
  type text not null,
  amount numeric(14, 2) not null,
  checked boolean not null default false,
  closed boolean not null default false,
  record_date text not null,
  month_key text,
  title text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, record_id),
  constraint savings_debt_records_type_check check (type in ('saving', 'debt')),
  constraint savings_debt_records_amount_check check (amount >= 0),
  constraint savings_debt_records_month_key_check check (
    month_key is null or month_key ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  )
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_settings_object_check check (jsonb_typeof(settings) = 'object')
);

create index if not exists finance_records_user_month_idx
  on public.finance_records (user_id, month_key);
create index if not exists savings_debt_records_user_month_idx
  on public.savings_debt_records (user_id, month_key);
create index if not exists planner_documents_user_updated_idx
  on public.planner_documents (user_id, updated_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists planner_documents_set_updated_at on public.planner_documents;
create trigger planner_documents_set_updated_at
before update on public.planner_documents
for each row execute function public.set_updated_at();

drop trigger if exists finance_records_set_updated_at on public.finance_records;
create trigger finance_records_set_updated_at
before update on public.finance_records
for each row execute function public.set_updated_at();

drop trigger if exists savings_debt_records_set_updated_at on public.savings_debt_records;
create trigger savings_debt_records_set_updated_at
before update on public.savings_debt_records
for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        name = case
          when excluded.name <> '' then excluded.name
          else public.profiles.name
        end;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.planner_documents enable row level security;
alter table public.finance_records enable row level security;
alter table public.savings_debt_records enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select to authenticated using ((select auth.uid()) = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists planner_documents_select_own on public.planner_documents;
create policy planner_documents_select_own on public.planner_documents
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists planner_documents_insert_own on public.planner_documents;
create policy planner_documents_insert_own on public.planner_documents
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists planner_documents_update_own on public.planner_documents;
create policy planner_documents_update_own on public.planner_documents
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
drop policy if exists planner_documents_delete_own on public.planner_documents;
create policy planner_documents_delete_own on public.planner_documents
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists finance_records_select_own on public.finance_records;
create policy finance_records_select_own on public.finance_records
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists finance_records_insert_own on public.finance_records;
create policy finance_records_insert_own on public.finance_records
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists finance_records_update_own on public.finance_records;
create policy finance_records_update_own on public.finance_records
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
drop policy if exists finance_records_delete_own on public.finance_records;
create policy finance_records_delete_own on public.finance_records
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists savings_debt_records_select_own on public.savings_debt_records;
create policy savings_debt_records_select_own on public.savings_debt_records
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists savings_debt_records_insert_own on public.savings_debt_records;
create policy savings_debt_records_insert_own on public.savings_debt_records
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists savings_debt_records_update_own on public.savings_debt_records;
create policy savings_debt_records_update_own on public.savings_debt_records
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
drop policy if exists savings_debt_records_delete_own on public.savings_debt_records;
create policy savings_debt_records_delete_own on public.savings_debt_records
for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists user_settings_select_own on public.user_settings;
create policy user_settings_select_own on public.user_settings
for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists user_settings_insert_own on public.user_settings;
create policy user_settings_insert_own on public.user_settings
for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists user_settings_update_own on public.user_settings;
create policy user_settings_update_own on public.user_settings
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
drop policy if exists user_settings_delete_own on public.user_settings;
create policy user_settings_delete_own on public.user_settings
for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.planner_documents to authenticated;
grant select, insert, update, delete on public.finance_records to authenticated;
grant select, insert, update, delete on public.savings_debt_records to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = false;

drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

commit;
