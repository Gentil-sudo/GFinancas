-- =====================================================================
-- Minhas Finanças — perfil do usuário (nome de exibição e tema)
--
-- Rode DEPOIS das migrations anteriores.
-- =====================================================================

create table public.perfis (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nome text check (nome is null or length(trim(nome)) between 1 and 60),
  tema text not null default 'clareza'
    check (tema in ('automatico', 'clareza', 'noite', 'lavanda')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.perfis
  for each row execute function private.set_updated_at();

alter table public.perfis enable row level security;

create policy perfis_select_proprio on public.perfis for select to authenticated
  using (user_id = (select auth.uid()));
create policy perfis_insert_proprio on public.perfis for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy perfis_update_proprio on public.perfis for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on public.perfis from anon;
