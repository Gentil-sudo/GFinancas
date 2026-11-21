-- =====================================================================
-- Teste de isolamento entre usuários (RLS)
--
-- Como rodar: Supabase > SQL Editor > New query > colar > Run.
--
-- O que faz:
--   1. Cria 2 usuários FICTÍCIOS (A e B) direto em auth.users.
--   2. Como A: cria lançamentos, uma compra em 12x, meta e investimento.
--   3. Como B: tenta ler, alterar, apagar e "roubar" os dados de A.
--   4. Como visitante não logado (anon): tenta ler e gravar.
--   5. APAGA os 2 usuários e tudo que foi criado (nada fica no banco).
--   6. Mostra uma tabela com ✅/❌ para cada teste.
--
-- Pode rodar quantas vezes quiser.
-- =====================================================================

create temp table if not exists _resultado_rls (ordem int, teste text, passou boolean);
truncate _resultado_rls;

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  testes text[] := '{}';
  oks boolean[] := '{}';
  n int;
  v numeric;
  erro text;
  r record;
  cat_a uuid;
  lanc_a uuid;
  compra_a uuid;
  meta_a uuid;
begin
  -- ---------------------------------------------------------------- setup
  insert into auth.users (id, email)
  values (a, 'teste-rls-a-' || a || '@exemplo.invalid'),
         (b, 'teste-rls-b-' || b || '@exemplo.invalid');

  -- ---------------------------------------------------------------- como A
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  select count(*) into n from public.categorias;
  testes := array_append(testes, 'A: recebeu as 14 categorias padrão no cadastro'); oks := oks || (n = 14);

  select id into cat_a from public.categorias where nome = 'Mercado' and tipo = 'saida';

  insert into public.lancamentos (tipo, descricao, valor, competencia, status)
  values ('entrada', 'Salário (teste)', 5000, '2026-11-01', 'pago');

  insert into public.lancamentos (tipo, descricao, categoria_id, valor, competencia, status, valor_pago)
  values ('saida', 'Mercado (teste)', cat_a, 300, '2026-11-01', 'parcial', 100)
  returning id into lanc_a;

  insert into public.compras_parceladas (descricao, valor_parcela, total_parcelas, primeira_competencia, dia_vencimento)
  values ('Compra teste', 135.00, 12, '2026-11-01', 31)
  returning id into compra_a;

  n := public.gerar_parcelas(compra_a);
  testes := array_append(testes, 'A: gerar_parcelas criou 12 parcelas de R$ 135,00'); oks := oks || (n = 12);

  n := public.gerar_parcelas(compra_a);
  testes := array_append(testes, 'A: chamar gerar_parcelas de novo não duplica'); oks := oks || (n = 0);

  select count(*) into n from public.lancamentos
  where compra_parcelada_id = compra_a and numero_parcela = 12
    and competencia = '2027-10-01' and descricao = 'Compra teste (12/12)';
  testes := array_append(testes, 'A: parcela 12/12 cai em out/2027'); oks := oks || (n = 1);

  select count(*) into n from public.lancamentos
  where compra_parcelada_id = compra_a and numero_parcela = 4 and vencimento = '2027-02-28';
  testes := array_append(testes, 'A: vencimento dia 31 vira 28/02 em fevereiro'); oks := oks || (n = 1);

  insert into public.metas (nome, valor_alvo, aporte_mensal_planejado, inicio, fim)
  values ('Meta teste', 47988, 2666, '2026-08-01', '2028-01-01')
  returning id into meta_a;
  insert into public.meta_movimentos (meta_id, tipo, valor, competencia)
  values (meta_a, 'aporte', 2666, '2026-11-01');

  insert into public.investimentos (tipo, competencia, moeda, valor, cotacao)
  values ('exterior', '2026-11-01', 'USD', 10, 4.98);
  select valor_brl into v from public.investimentos where user_id = a;
  testes := array_append(testes, 'A: exterior 10 USD × 4,98 = R$ 49,80'); oks := oks || (v = 49.80);

  select * into r from public.resumo_mensal where competencia = '2026-11-01';
  testes := array_append(testes, 'A: resumo de nov/2026 bate (entradas 5000, saídas 435, pago 100, pendente 335, resultado 4900, total 4949,80)');
  oks := oks || (r.total_entradas = 5000 and r.total_saidas = 435 and r.total_pago = 100
                 and r.total_pendente = 335 and r.resultado = 4900
                 and r.total_investido = 49.80 and r.total = 4949.80);

  select count(*) into n from public.historico where tabela = 'lancamentos';
  testes := array_append(testes, 'A: histórico registrou os 14 lançamentos'); oks := oks || (n = 14);

  insert into public.perfis (nome, tema) values ('Pessoa A', 'noite');

  -- ---------------------------------------------------------------- como B
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);

  select count(*) into n from public.perfis;
  testes := array_append(testes, 'B: não vê o perfil de A'); oks := oks || (n = 0);

  update public.perfis set tema = 'lavanda' where user_id = a;
  get diagnostics n = row_count;
  testes := array_append(testes, 'B: não consegue alterar o perfil de A'); oks := oks || (n = 0);

  select count(*) into n from public.lancamentos;
  testes := array_append(testes, 'B: não vê lançamentos de A'); oks := oks || (n = 0);

  select count(*) into n from public.compras_parceladas;
  testes := array_append(testes, 'B: não vê compras parceladas de A'); oks := oks || (n = 0);

  select (select count(*) from public.metas) + (select count(*) from public.meta_movimentos) into n;
  testes := array_append(testes, 'B: não vê metas nem aportes de A'); oks := oks || (n = 0);

  select count(*) into n from public.investimentos;
  testes := array_append(testes, 'B: não vê investimentos de A'); oks := oks || (n = 0);

  select count(*) into n from public.resumo_mensal;
  testes := array_append(testes, 'B: resumo_mensal vazio (view respeita o RLS)'); oks := oks || (n = 0);

  select count(*) into n from public.categorias where user_id <> b;
  testes := array_append(testes, 'B: só vê as próprias categorias'); oks := oks || (n = 0);

  select count(*) into n from public.historico where user_id <> b;
  testes := array_append(testes, 'B: não vê o histórico de A'); oks := oks || (n = 0);

  update public.lancamentos set observacao = 'alterado por B' where id = lanc_a;
  get diagnostics n = row_count;
  testes := array_append(testes, 'B: não consegue alterar lançamento de A'); oks := oks || (n = 0);

  delete from public.lancamentos where id = lanc_a;
  get diagnostics n = row_count;
  testes := array_append(testes, 'B: não consegue apagar lançamento de A'); oks := oks || (n = 0);

  update public.categorias set nome = 'Hackeado' where id = cat_a;
  get diagnostics n = row_count;
  testes := array_append(testes, 'B: não consegue renomear categoria de A'); oks := oks || (n = 0);

  erro := null;
  begin
    insert into public.lancamentos (user_id, tipo, descricao, valor, competencia)
    values (a, 'saida', 'Intruso', 1, '2026-11-01');
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'B: não consegue gravar dados em nome de A'); oks := oks || (erro = '42501');

  erro := null;
  begin
    insert into public.lancamentos (tipo, descricao, categoria_id, valor, competencia)
    values ('saida', 'Intruso', cat_a, 1, '2026-11-01');
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'B: não consegue usar categoria de A'); oks := oks || (erro = '23503');

  erro := null;
  begin
    perform public.gerar_parcelas(compra_a);
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'B: não consegue gerar parcelas da compra de A'); oks := oks || (erro = 'P0002');

  erro := null;
  begin
    insert into public.historico (user_id, tabela, registro_id, acao)
    values (b, 'lancamentos', gen_random_uuid(), 'insert');
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'B: não consegue escrever no histórico'); oks := oks || (erro = '42501');

  erro := null;
  begin
    delete from public.historico;
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'B: não consegue apagar o histórico'); oks := oks || (erro = '42501');

  -- ---------------------------------------------------------------- não logado
  set local role anon;
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

  erro := null;
  begin
    select count(*) into n from public.lancamentos;
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'Visitante: não lê lançamentos'); oks := oks || (erro is not null or n = 0);

  erro := null;
  begin
    insert into public.lancamentos (tipo, descricao, valor, competencia)
    values ('saida', 'Intruso', 1, '2026-11-01');
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'Visitante: não grava lançamentos'); oks := oks || (erro is not null);

  -- ---------------------------------------------------------------- A de novo
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  select valor into v from public.lancamentos where id = lanc_a and observacao is null;
  testes := array_append(testes, 'A: lançamento continua intacto depois das tentativas de B'); oks := oks || (v = 300);

  -- ---------------------------------------------------------------- limpeza
  reset role;
  perform set_config('request.jwt.claims', '', true);

  delete from auth.users where id in (a, b); -- apaga em cascata tudo de A e B
  delete from public.historico where user_id in (a, b);

  select (select count(*) from public.lancamentos where user_id in (a, b))
       + (select count(*) from public.categorias where user_id in (a, b))
       + (select count(*) from public.historico where user_id in (a, b)) into n;
  testes := array_append(testes, 'Limpeza: nenhum dado de teste ficou no banco'); oks := oks || (n = 0);

  insert into _resultado_rls
  select ordem, teste, passou
  from unnest(testes, oks) with ordinality as x(teste, passou, ordem);
end;
$$;

select
  ordem as "#",
  case when passou then '✅' else '❌' end as ok,
  teste
from _resultado_rls
order by ordem;
