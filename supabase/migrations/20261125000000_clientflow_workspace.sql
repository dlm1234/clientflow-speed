begin;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  name text not null check (name ~ '[^[:space:]]'),
  email text check (email is null or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone text,
  company text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  client_id uuid not null,
  name text not null check (name ~ '[^[:space:]]'),
  description text,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_owned_client_fk foreign key (owner_id, client_id)
    references public.clients(owner_id, id) on delete restrict
);

create index projects_owner_client_idx on public.projects(owner_id, client_id);

create function public.clientflow_set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.statement_timestamp();
  return new;
end;
$$;

create trigger clients_set_updated_at before update on public.clients
  for each row execute function public.clientflow_set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.clientflow_set_updated_at();

alter table public.clients enable row level security;
alter table public.projects enable row level security;
revoke all on public.clients, public.projects from public, anon, authenticated;
revoke all on function public.clientflow_set_updated_at() from public, anon, authenticated;
grant select, delete on public.clients, public.projects to authenticated;
grant insert (name, email, phone, company, notes), update (name, email, phone, company, notes)
  on public.clients to authenticated;
grant insert (client_id, name, description, status), update (client_id, name, description, status)
  on public.projects to authenticated;

create policy clients_select on public.clients for select to authenticated using (owner_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy clients_insert on public.clients for insert to authenticated with check (owner_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy clients_update on public.clients for update to authenticated using (owner_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true') with check (owner_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy clients_delete on public.clients for delete to authenticated using (owner_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy projects_select on public.projects for select to authenticated using (owner_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy projects_insert on public.projects for insert to authenticated with check (owner_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy projects_update on public.projects for update to authenticated using (owner_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true') with check (owner_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');
create policy projects_delete on public.projects for delete to authenticated using (owner_id = (select auth.uid()) and (select auth.jwt()->>'is_anonymous') is distinct from 'true');

commit;
