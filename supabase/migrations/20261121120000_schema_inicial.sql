-- =====================================================================
-- Minhas Finanças — schema inicial
--
-- Como rodar: Supabase > SQL Editor > New query > colar este arquivo > Run.
-- Depois rode 20261121120100_categorias_padrao.sql.
-- =====================================================================

-- Funções internas (triggers, seed) ficam fora do schema `public`, que é exposto pela API.
create schema if not exists private;
revoke all on schema private from public;

-- =====================================================================
-- 1. Tabelas
-- =====================================================================

-- Categorias (ex.: Mercado, Transporte, Faculdade, Salário, Móveis...)
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  tipo text not null check (tipo in ('entrada', 'saida')),
  cor text,
  icone text,
  arquivada boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, nome, tipo),
  -- Alvo das FKs compostas: garante que só se referencia categoria do próprio usuário.
  unique (id, user_id)
);

-- Metas / caixinhas (Casamento, Móveis...)
create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  valor_alvo numeric(12, 2) check (valor_alvo > 0),
  aporte_mensal_planejado numeric(12, 2) check (aporte_mensal_planejado > 0),
  inicio date check (extract(day from inicio) = 1),
  fim date check (extract(day from fim) = 1),
  cor text,
  arquivada boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (inicio is null or fim is null or fim >= inicio),
  unique (id, user_id)
);

-- Compras parceladas / contas recorrentes
create table public.compras_parceladas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descricao text not null check (length(trim(descricao)) > 0),
  categoria_id uuid,
  valor_parcela numeric(12, 2) not null check (valor_parcela > 0),
  total_parcelas int not null check (total_parcelas between 1 and 480),
  primeira_competencia date not null check (extract(day from primeira_competencia) = 1),
  dia_vencimento int check (dia_vencimento between 1 and 31),
  meta_id uuid,
  observacao text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (categoria_id, user_id) references public.categorias (id, user_id),
  foreign key (meta_id, user_id) references public.metas (id, user_id)
);

-- Lançamentos: tudo que entra ou sai
create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida')),
  descricao text not null check (length(trim(descricao)) > 0),
  categoria_id uuid,
  valor numeric(12, 2) not null check (valor > 0),
  competencia date not null check (extract(day from competencia) = 1), -- dia 1 do mês
  data date not null default current_date,
  vencimento date,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'parcial')),
  valor_pago numeric(12, 2) not null default 0 check (valor_pago >= 0),
  data_pagamento date,
  compra_parcelada_id uuid,
  numero_parcela int check (numero_parcela > 0),
  observacao text,
  deleted_at timestamptz, -- soft delete (lixeira)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lancamentos_parcial_valido
    check (status <> 'parcial' or (valor_pago > 0 and valor_pago < valor)),
  foreign key (categoria_id, user_id) references public.categorias (id, user_id),
  foreign key (compra_parcelada_id, user_id) references public.compras_parceladas (id, user_id)
    on delete set null (compra_parcelada_id)
);

create index lancamentos_user_competencia_idx
  on public.lancamentos (user_id, competencia) where deleted_at is null;
create index lancamentos_compra_idx
  on public.lancamentos (compra_parcelada_id) where compra_parcelada_id is not null;
-- Uma compra nunca tem duas parcelas "vivas" com o mesmo número.
create unique index lancamentos_parcela_unica_idx
  on public.lancamentos (compra_parcelada_id, numero_parcela)
  where compra_parcelada_id is not null and deleted_at is null;

-- Aportes e retiradas das metas
create table public.meta_movimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meta_id uuid not null,
  tipo text not null check (tipo in ('aporte', 'retirada')),
  valor numeric(12, 2) not null check (valor > 0),
  competencia date not null check (extract(day from competencia) = 1),
  descricao text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (meta_id, user_id) references public.metas (id, user_id) on delete cascade
);

create index meta_movimentos_meta_idx on public.meta_movimentos (meta_id) where deleted_at is null;

-- Investimentos: snapshot de saldo por tipo e mês
create table public.investimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('acoes', 'fundos', 'etf', 'exterior', 'renda_fixa', 'outros')),
  descricao text,
  competencia date not null check (extract(day from competencia) = 1),
  moeda text not null default 'BRL' check (moeda in ('BRL', 'USD')),
  valor numeric(14, 2) not null check (valor >= 0),
  cotacao numeric(10, 4), -- usado quando moeda = USD (digitada à mão)
  valor_brl numeric(14, 2) generated always as
    (case when moeda = 'USD' then round(valor * coalesce(cotacao, 0), 2) else valor end) stored,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investimentos_cotacao_usd check (moeda = 'BRL' or cotacao > 0)
);

create index investimentos_user_competencia_idx
  on public.investimentos (user_id, competencia) where deleted_at is null;

-- Histórico/auditoria: toda alteração fica registrada (proteção contra perda)
create table public.historico (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('insert', 'update', 'delete')),
  antes jsonb,
  depois jsonb,
  created_at timestamptz not null default now()
);

create index historico_user_data_idx on public.historico (user_id, created_at desc);
create index historico_registro_idx on public.historico (tabela, registro_id);

-- =====================================================================
-- 2. Triggers
-- =====================================================================

-- updated_at automático
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.metas
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.compras_parceladas
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.lancamentos
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.meta_movimentos
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.investimentos
  for each row execute function private.set_updated_at();

-- Mantém status e valor_pago coerentes:
--   pago     → valor_pago = valor (e data_pagamento = hoje, se vazia)
--   pendente → valor_pago = 0 e sem data_pagamento
--   parcial  → valor_pago informado pelo usuário (checado pela constraint)
create function private.normalizar_lancamento()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'pago' then
    new.valor_pago := new.valor;
    new.data_pagamento := coalesce(new.data_pagamento, current_date);
  elsif new.status = 'pendente' then
    new.valor_pago := 0;
    new.data_pagamento := null;
  else
    new.data_pagamento := coalesce(new.data_pagamento, current_date);
  end if;
  return new;
end;
$$;

create trigger normalizar_status before insert or update on public.lancamentos
  for each row execute function private.normalizar_lancamento();

-- Auditoria: grava o antes/depois de cada alteração em `historico`.
-- `security definer` porque o cliente não tem permissão de escrever em `historico`.
create function private.registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_antes jsonb;
  v_depois jsonb;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_antes := to_jsonb(old);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_depois := to_jsonb(new);
  end if;

  -- Não registra updates que não mudaram nada além do updated_at.
  if tg_op = 'UPDATE' and (v_antes - 'updated_at') = (v_depois - 'updated_at') then
    return null;
  end if;

  insert into public.historico (user_id, tabela, registro_id, acao, antes, depois)
  values (
    coalesce(v_depois ->> 'user_id', v_antes ->> 'user_id')::uuid,
    tg_table_name,
    coalesce(v_depois ->> 'id', v_antes ->> 'id')::uuid,
    lower(tg_op),
    v_antes,
    v_depois
  );
  return null;
end;
$$;

create trigger auditoria after insert or update or delete on public.categorias
  for each row execute function private.registrar_historico();
create trigger auditoria after insert or update or delete on public.metas
  for each row execute function private.registrar_historico();
create trigger auditoria after insert or update or delete on public.compras_parceladas
  for each row execute function private.registrar_historico();
create trigger auditoria after insert or update or delete on public.lancamentos
  for each row execute function private.registrar_historico();
create trigger auditoria after insert or update or delete on public.meta_movimentos
  for each row execute function private.registrar_historico();
create trigger auditoria after insert or update or delete on public.investimentos
  for each row execute function private.registrar_historico();

-- =====================================================================
-- 3. Row Level Security: cada usuário só enxerga e altera o que é dele
-- =====================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'categorias', 'metas', 'compras_parceladas', 'lancamentos', 'meta_movimentos', 'investimentos'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy %I on public.%I for select to authenticated
         using (user_id = (select auth.uid()))',
      t || '_select_proprio', t);

    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (user_id = (select auth.uid()))',
      t || '_insert_proprio', t);

    execute format(
      'create policy %I on public.%I for update to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t || '_update_proprio', t);

    execute format(
      'create policy %I on public.%I for delete to authenticated
         using (user_id = (select auth.uid()))',
      t || '_delete_proprio', t);
  end loop;
end;
$$;

-- Histórico: o usuário só LÊ o próprio histórico. Escrita apenas pelo trigger de auditoria.
alter table public.historico enable row level security;

create policy historico_select_proprio on public.historico for select to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete, truncate on public.historico from anon, authenticated;

-- =====================================================================
-- 4. View: resumo do mês
-- =====================================================================
-- security_invoker = true → a view respeita o RLS de quem consulta.
create view public.resumo_mensal
with (security_invoker = true)
as
with l as (
  select
    user_id,
    competencia,
    coalesce(sum(valor) filter (where tipo = 'entrada'), 0) as total_entradas,
    coalesce(sum(valor) filter (where tipo = 'saida'), 0) as total_saidas,
    coalesce(sum(valor_pago) filter (where tipo = 'saida'), 0) as total_pago,
    coalesce(sum(valor - valor_pago) filter (where tipo = 'saida' and status <> 'pago'), 0)
      as total_pendente
  from public.lancamentos
  where deleted_at is null
  group by user_id, competencia
),
i as (
  select user_id, competencia, sum(valor_brl) as total_investido
  from public.investimentos
  where deleted_at is null
  group by user_id, competencia
)
select
  user_id,
  competencia,
  coalesce(l.total_entradas, 0)::numeric(14, 2) as total_entradas,
  coalesce(l.total_saidas, 0)::numeric(14, 2) as total_saidas,
  coalesce(l.total_pago, 0)::numeric(14, 2) as total_pago,
  coalesce(l.total_pendente, 0)::numeric(14, 2) as total_pendente,
  (coalesce(l.total_entradas, 0) - coalesce(l.total_pago, 0))::numeric(14, 2) as resultado,
  coalesce(i.total_investido, 0)::numeric(14, 2) as total_investido,
  (coalesce(l.total_entradas, 0) - coalesce(l.total_pago, 0) + coalesce(i.total_investido, 0))
    ::numeric(14, 2) as total
from l
full join i using (user_id, competencia);

revoke all on public.resumo_mensal from anon;

-- =====================================================================
-- 5. RPC: gerar as parcelas de uma compra
-- =====================================================================
-- Cria um lançamento de saída por mês: "Sofá (3/12)".
--   a_partir_de: primeira parcela a gerar (para compras já em andamento: "parcela atual = X de N").
-- Pode ser chamada de novo sem duplicar: parcelas que já existem são ignoradas.
-- Retorna quantas parcelas foram criadas.
-- security invoker: roda com as permissões (e o RLS) de quem chamou.
create function public.gerar_parcelas(compra_id uuid, a_partir_de int default 1)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  c public.compras_parceladas%rowtype;
  n int;
  v_comp date;
  v_venc date;
  v_linhas int;
  v_criadas int := 0;
begin
  select * into c
  from public.compras_parceladas
  where id = compra_id and deleted_at is null;

  if not found then
    raise exception 'Compra parcelada não encontrada' using errcode = 'P0002';
  end if;

  if a_partir_de < 1 or a_partir_de > c.total_parcelas then
    raise exception 'Parcela inicial inválida: % (a compra tem % parcelas)',
      a_partir_de, c.total_parcelas using errcode = '22023';
  end if;

  for n in a_partir_de .. c.total_parcelas loop
    v_comp := (c.primeira_competencia + make_interval(months => n - 1))::date;

    -- Vencimento no dia escolhido, limitado ao último dia do mês (ex.: dia 31 em fevereiro → 28/29).
    v_venc := case
      when c.dia_vencimento is null then null
      else v_comp + (least(
        c.dia_vencimento,
        extract(day from (v_comp + interval '1 month' - interval '1 day'))::int
      ) - 1)
    end;

    insert into public.lancamentos (
      user_id, tipo, descricao, categoria_id, valor, competencia, data, vencimento,
      status, compra_parcelada_id, numero_parcela
    ) values (
      c.user_id, 'saida', format('%s (%s/%s)', c.descricao, n, c.total_parcelas),
      c.categoria_id, c.valor_parcela, v_comp, coalesce(v_venc, v_comp), v_venc,
      'pendente', c.id, n
    )
    on conflict do nothing;

    get diagnostics v_linhas = row_count;
    v_criadas := v_criadas + v_linhas;
  end loop;

  return v_criadas;
end;
$$;

revoke execute on function public.gerar_parcelas(uuid, int) from public, anon;
grant execute on function public.gerar_parcelas(uuid, int) to authenticated;
