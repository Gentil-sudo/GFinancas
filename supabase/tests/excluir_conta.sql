-- =====================================================================
-- Teste de "Excluir minha conta"
--
-- Como rodar: Supabase > SQL Editor > New query > colar > Run.
-- Cria 2 usuários FICTÍCIOS (A e B) com dados, A exclui a própria conta,
-- e confere que só os dados de A sumiram. Apaga tudo no final.
-- =====================================================================

create temp table if not exists _resultado_exclusao (ordem int, teste text, passou boolean);
truncate _resultado_exclusao;

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  testes text[] := '{}';
  oks boolean[] := '{}';
  n int;
  erro text;
  cat uuid;
  meta uuid;
begin
  insert into auth.users (id, email)
  values (a, 'teste-excl-a-' || a || '@exemplo.invalid'),
         (b, 'teste-excl-b-' || b || '@exemplo.invalid');

  -- ---------------------------------------------------------------- dados de A e de B
  set local role authenticated;
  foreach erro in array array[a::text, b::text] loop
    perform set_config('request.jwt.claims', json_build_object('sub', erro, 'role', 'authenticated')::text, true);
    select id into cat from public.categorias where nome = 'Móveis' and tipo = 'saida';
    insert into public.perfis (nome) values ('Fictício');
    insert into public.metas (nome, valor_alvo) values ('Viagem', 1000) returning id into meta;
    insert into public.meta_movimentos (meta_id, tipo, valor, competencia) values (meta, 'aporte', 100, '2026-11-01');
    perform public.criar_compra_parcelada('Sofá', 135, 3, '2026-11-01', 10, cat);
    insert into public.lancamentos (tipo, descricao, valor, competencia, categoria_id)
    values ('saida', 'Mercado', 50, '2026-11-01', cat);
    insert into public.investimentos (tipo, competencia, valor) values ('renda_fixa', '2026-11-01', 500);
  end loop;
  erro := null;

  -- ---------------------------------------------------------------- sem login não funciona
  perform set_config('request.jwt.claims', '', true);
  begin
    perform public.excluir_minha_conta();
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'Sem login: recusa'); oks := oks || (erro = '42501');

  -- ---------------------------------------------------------------- A exclui a conta
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.excluir_minha_conta();

  reset role;
  perform set_config('request.jwt.claims', '', true);

  select (select count(*) from public.lancamentos where user_id = a)
       + (select count(*) from public.compras_parceladas where user_id = a)
       + (select count(*) from public.metas where user_id = a)
       + (select count(*) from public.meta_movimentos where user_id = a)
       + (select count(*) from public.investimentos where user_id = a)
       + (select count(*) from public.categorias where user_id = a)
       + (select count(*) from public.perfis where user_id = a) into n;
  testes := array_append(testes, 'A: todos os dados financeiros apagados'); oks := oks || (n = 0);

  select count(*) into n from public.historico where user_id = a;
  testes := array_append(testes, 'A: histórico apagado'); oks := oks || (n = 0);

  select count(*) into n from auth.users where id = a;
  testes := array_append(testes, 'A: conta de acesso apagada'); oks := oks || (n = 0);

  select (select count(*) from public.lancamentos where user_id = b) into n;
  testes := array_append(testes, 'B: lançamentos intactos (3 parcelas + 1)'); oks := oks || (n = 4);

  select (select count(*) from public.metas where user_id = b)
       + (select count(*) from public.meta_movimentos where user_id = b)
       + (select count(*) from public.investimentos where user_id = b)
       + (select count(*) from public.perfis where user_id = b) into n;
  testes := array_append(testes, 'B: metas, aportes, investimentos e perfil intactos'); oks := oks || (n = 4);

  select count(*) into n from public.historico where user_id = b;
  testes := array_append(testes, 'B: histórico intacto'); oks := oks || (n > 0);

  select count(*) into n from auth.users where id = b;
  testes := array_append(testes, 'B: conta de acesso intacta'); oks := oks || (n = 1);

  -- ---------------------------------------------------------------- limpeza
  delete from auth.users where id in (a, b);
  delete from public.historico where user_id in (a, b);
  select count(*) into n from public.historico where user_id in (a, b);
  testes := array_append(testes, 'Limpeza: nenhum dado de teste ficou no banco'); oks := oks || (n = 0);

  insert into _resultado_exclusao
  select ordem, teste, passou
  from unnest(testes, oks) with ordinality as x(teste, passou, ordem);
end;
$$;

select
  ordem as "#",
  case when passou then '✅' else '❌' end as ok,
  teste
from _resultado_exclusao
order by ordem;
