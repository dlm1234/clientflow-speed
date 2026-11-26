-- psql only. Run against a fresh, disposable project as its migration owner.
-- Set -v user_a and -v user_b to two existing, distinct test-user UUIDs.
\set ON_ERROR_STOP on
begin;
select set_config('clientflow.test_user_a', :'user_a', true),
       set_config('clientflow.test_user_b', :'user_b', true);
do $$
declare
  a uuid := current_setting('clientflow.test_user_a')::uuid;
  b uuid := current_setting('clientflow.test_user_b')::uuid;
begin
  if a = b or (select count(*) from auth.users where id in (a, b)) <> 2 then
    raise exception 'Two distinct existing test users are required';
  end if;
end $$;

set local role authenticated;
-- Use the request claims context used by the Supabase Data API.
select set_config('request.jwt.claim.sub', '', true),
       set_config('request.jwt.claims', jsonb_build_object(
         'sub', current_setting('clientflow.test_user_a'),
         'role', 'authenticated', 'is_anonymous', false
       )::text, true);
do $$
declare
  client uuid;
  project uuid;
  modified timestamptz;
begin
  insert into public.clients(name) values ('RLS test client A') returning id into client;
  perform set_config('clientflow.client_a', client::text, true);
  insert into public.projects(client_id, name) values (client, 'RLS test project A') returning id into project;
  perform set_config('clientflow.project_a', project::text, true);
  if not exists (select 1 from public.projects where id = project and status = 'planned') then
    raise exception 'Owner A must read its project and default state';
  end if;
  update public.clients set company = 'Test company' where id = client returning updated_at into modified;
  if modified is null or modified <> statement_timestamp() then raise exception 'Timestamp not maintained'; end if;
  update public.projects set status = 'completed' where id = project;
  if not exists (select 1 from public.projects where id = project and status = 'completed') then
    raise exception 'Owner A must update its project';
  end if;
  begin
    delete from public.clients where id = client;
    raise exception 'Deleting a referenced client should fail';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into public.projects(client_id, name, status) values (client, 'Invalid status', 'unknown');
    raise exception 'Unknown status should fail';
  exception when check_violation then null;
  end;
end $$;

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', current_setting('clientflow.test_user_b'),
  'role', 'authenticated', 'is_anonymous', false
)::text, true);
do $$
declare
  a uuid := current_setting('clientflow.test_user_a')::uuid;
  client_a uuid := current_setting('clientflow.client_a')::uuid;
  project_a uuid := current_setting('clientflow.project_a')::uuid;
  client_b uuid;
  project_b uuid;
begin
  if exists (select 1 from public.clients where id = client_a) or exists (select 1 from public.projects where id = project_a) then
    raise exception 'Owner B must not read A rows';
  end if;
  update public.clients set name = 'Cross-owner write' where id = client_a;
  if found then raise exception 'Owner B must not update A client'; end if;
  update public.projects set name = 'Cross-owner write' where id = project_a;
  if found then raise exception 'Owner B must not update A project'; end if;
  delete from public.projects where id = project_a;
  if found then raise exception 'Owner B must not delete A project'; end if;
  delete from public.clients where id = client_a;
  if found then raise exception 'Owner B must not delete A client'; end if;

  insert into public.clients(name) values ('RLS test client B') returning id into client_b;
  insert into public.projects(client_id, name) values (client_b, 'RLS test project B') returning id into project_b;
  perform set_config('clientflow.client_b', client_b::text, true);
  perform set_config('clientflow.project_b', project_b::text, true);
  begin
    insert into public.clients(owner_id, name) values (a, 'Wrong owner');
    raise exception 'Explicit client owner should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.clients set owner_id = a where id = client_b;
    raise exception 'Changing client owner should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.projects(owner_id, client_id, name) values (a, client_a, 'Wrong owner');
    raise exception 'Explicit project owner should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.projects set owner_id = a where id = project_b;
    raise exception 'Changing project owner should fail';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.projects(client_id, name) values (client_a, 'Wrong client');
    raise exception 'Cross-owner client association should fail';
  exception when foreign_key_violation then null;
  end;
  begin
    update public.projects set client_id = client_a where id = project_b;
    raise exception 'Cross-owner client reassignment should fail';
  exception when foreign_key_violation then null;
  end;
end $$;

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', current_setting('clientflow.test_user_a'),
  'role', 'authenticated', 'is_anonymous', false
)::text, true);
do $$
begin
  if exists (select 1 from public.clients where id = current_setting('clientflow.client_b')::uuid)
    or exists (select 1 from public.projects where id = current_setting('clientflow.project_b')::uuid) then
    raise exception 'Owner A must not read B rows';
  end if;
  delete from public.projects where id = current_setting('clientflow.project_a')::uuid;
  if not found then raise exception 'Owner A must delete its project'; end if;
  delete from public.clients where id = current_setting('clientflow.client_a')::uuid;
  if not found then raise exception 'Owner A must delete its unreferenced client'; end if;
end $$;

-- Supabase anonymous sign-ins use the authenticated SQL role. Use B's
-- existing fixtures to isolate the claim check from cross-owner filtering.
do $$
declare
  context jsonb;
  client uuid := current_setting('clientflow.client_b')::uuid;
  project uuid := current_setting('clientflow.project_b')::uuid;
begin
  for context in
    select claims from (values
      (jsonb_build_object(
        'sub', current_setting('clientflow.test_user_b'),
        'role', 'authenticated', 'is_anonymous', true
      )),
      (jsonb_build_object('role', 'authenticated', 'is_anonymous', false))
    ) as denied(claims)
  loop
    perform set_config('request.jwt.claims', context::text, true);
    if exists (select 1 from public.clients where id = client)
      or exists (select 1 from public.projects where id = project) then
      raise exception 'Denied request context must not read workspace records';
    end if;
    update public.clients set name = 'Denied update' where id = client;
    if found then raise exception 'Denied request context must not update a client'; end if;
    update public.projects set name = 'Denied update' where id = project;
    if found then raise exception 'Denied request context must not update a project'; end if;
    delete from public.projects where id = project;
    if found then raise exception 'Denied request context must not delete a project'; end if;
    delete from public.clients where id = client;
    if found then raise exception 'Denied request context must not delete a client'; end if;
    begin
      insert into public.clients(name) values ('Denied insert');
      raise exception 'Denied request context must not insert a client';
    exception when insufficient_privilege then null;
    end;
    begin
      insert into public.projects(client_id, name) values (client, 'Denied insert');
      raise exception 'Denied request context must not insert a project';
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;

reset role;
set local role anon;
do $$
begin
  if pg_catalog.has_table_privilege(current_user, 'public.clients', 'SELECT, INSERT, UPDATE, DELETE')
    or pg_catalog.has_table_privilege(current_user, 'public.projects', 'SELECT, INSERT, UPDATE, DELETE')
    or pg_catalog.has_any_column_privilege(current_user, 'public.clients', 'SELECT, INSERT, UPDATE')
    or pg_catalog.has_any_column_privilege(current_user, 'public.projects', 'SELECT, INSERT, UPDATE') then
    raise exception 'Anonymous roles must not have data privileges';
  end if;
end $$;
rollback;
