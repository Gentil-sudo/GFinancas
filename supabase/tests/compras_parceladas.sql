-- =====================================================================
-- Teste das operações de compras parceladas (criar, editar, cancelar, desfazer)
--
-- Como rodar: Supabase > SQL Editor > New query > colar > Run.
-- Cria 2 usuários FICTÍCIOS, testa e APAGA tudo no final. Pode rodar quantas vezes quiser.
-- =====================================================================

create temp table if not exists _resultado_parcelas (ordem int, teste text, passou boolean);
truncate _resultado_parcelas;

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  testes text[] := '{}';
  oks boolean[] := '{}';
  n int;
  v numeric;
  t text;
  erro text;
  quando timestamptz;
  compra uuid;
  compra2 uuid;
  cat uuid;
begin
  insert into auth.users (id, email)
  values (a, 'teste-parc-a-' || a || '@exemplo.invalid'),
         (b, 'teste-parc-b-' || b || '@exemplo.invalid');

  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select id into cat from public.categorias where nome = 'Móveis' and tipo = 'saida';

  -- ---------------------------------------------------------------- criar
  compra := public.criar_compra_parcelada('Sofá', 135, 12, '2026-11-01', 31, cat);
  select count(*) into n from public.lancamentos where compra_parcelada_id = compra and deleted_at is null;
  testes := array_append(testes, 'Criar 12× R$ 135: gera 12 parcelas'); oks := oks || (n = 12);

  select count(*) into n from public.lancamentos
  where compra_parcelada_id = compra and numero_parcela = 4
    and competencia = '2027-02-01' and vencimento = '2027-02-28' and descricao = 'Sofá (4/12)';
  testes := array_append(testes, 'Parcela 4/12 em fev/2027, vencimento 28/02'); oks := oks || (n = 1);

  compra2 := public.criar_compra_parcelada('Notebook', 287.30, 11, '2026-08-01', null, cat, null, null, 4);
  select count(*), min(numero_parcela) into n, v from public.lancamentos where compra_parcelada_id = compra2;
  testes := array_append(testes, 'Compra em andamento (parcela atual 4 de 11): gera só 4..11'); oks := oks || (n = 8 and v = 4);

  -- ---------------------------------------------------------------- pagar 1 e 2
  update public.lancamentos set status = 'pago'
  where compra_parcelada_id = compra and numero_parcela in (1, 2);

  -- ---------------------------------------------------------------- editar (só não pagas)
  perform public.atualizar_compra_parcelada(compra, 'Sofá novo', 150, 10, 10, cat);

  select count(*) into n from public.lancamentos where compra_parcelada_id = compra and deleted_at is null;
  testes := array_append(testes, 'Editar total 12 → 10: sobram 10 parcelas'); oks := oks || (n = 10);

  select descricao, valor into t, v from public.lancamentos where compra_parcelada_id = compra and numero_parcela = 1;
  testes := array_append(testes, 'Parcela paga mantém valor e nome, total atualizado ("Sofá (1/10)", 135)'); oks := oks || (t = 'Sofá (1/10)' and v = 135);

  select descricao, valor into t, v from public.lancamentos where compra_parcelada_id = compra and numero_parcela = 5;
  testes := array_append(testes, 'Parcela não paga recebe nome e valor novos ("Sofá novo (5/10)", 150)'); oks := oks || (t = 'Sofá novo (5/10)' and v = 150);

  select count(*) into n from public.lancamentos where compra_parcelada_id = compra and numero_parcela = 5 and vencimento = '2027-03-10';
  testes := array_append(testes, 'Novo dia de vencimento (10) aplicado'); oks := oks || (n = 1);

  -- ---------------------------------------------------------------- aumentar total
  perform public.atualizar_compra_parcelada(compra, 'Sofá novo', 150, 14, 10, cat);
  select count(*) into n from public.lancamentos where compra_parcelada_id = compra and deleted_at is null;
  testes := array_append(testes, 'Editar total 10 → 14: gera as que faltam (14)'); oks := oks || (n = 14);

  -- ---------------------------------------------------------------- não pode encolher abaixo das pagas
  erro := null;
  begin
    perform public.atualizar_compra_parcelada(compra, 'Sofá novo', 150, 1, 10, cat);
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'Recusa total menor que a última parcela paga'); oks := oks || (erro = '22023');

  -- ---------------------------------------------------------------- incluir pagas
  perform public.atualizar_compra_parcelada(compra, 'Sofá azul', 150, 14, 10, cat, null, null, true);
  select descricao, valor into t, v from public.lancamentos where compra_parcelada_id = compra and numero_parcela = 1;
  testes := array_append(testes, 'Com "incluir pagas": parcela paga também muda'); oks := oks || (t = 'Sofá azul (1/14)' and v = 150);

  -- ---------------------------------------------------------------- cancelar + desfazer
  quando := public.cancelar_compra_parcelada(compra);
  select count(*) into n from public.lancamentos where compra_parcelada_id = compra and deleted_at is null;
  testes := array_append(testes, 'Cancelar: só as 2 pagas continuam'); oks := oks || (n = 2);

  select count(*) into n from public.compras_parceladas where id = compra and deleted_at is not null;
  testes := array_append(testes, 'Cancelar: compra vai para a lixeira'); oks := oks || (n = 1);

  perform public.restaurar_compra_parcelada(compra, quando);
  select count(*) into n from public.lancamentos where compra_parcelada_id = compra and deleted_at is null;
  testes := array_append(testes, 'Desfazer cancelamento: volta tudo (14)'); oks := oks || (n = 14);

  -- ---------------------------------------------------------------- B não mexe nas compras de A
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);

  erro := null;
  begin
    perform public.atualizar_compra_parcelada(compra, 'Hackeado', 1, 1);
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'B não consegue editar a compra de A'); oks := oks || (erro = 'P0002');

  erro := null;
  begin
    perform public.cancelar_compra_parcelada(compra);
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'B não consegue cancelar a compra de A'); oks := oks || (erro = 'P0002');

  erro := null;
  begin
    perform public.criar_compra_parcelada('Intruso', 10, 2, '2026-11-01', null, cat);
  exception when others then erro := sqlstate;
  end;
  testes := array_append(testes, 'B não consegue usar a categoria de A'); oks := oks || (erro = '23503');

  -- ---------------------------------------------------------------- limpeza
  reset role;
  perform set_config('request.jwt.claims', '', true);
  delete from auth.users where id in (a, b);
  delete from public.historico where user_id in (a, b);

  select (select count(*) from public.lancamentos where user_id in (a, b))
       + (select count(*) from public.compras_parceladas where user_id in (a, b)) into n;
  testes := array_append(testes, 'Limpeza: nenhum dado de teste ficou no banco'); oks := oks || (n = 0);

  insert into _resultado_parcelas
  select ordem, teste, passou
  from unnest(testes, oks) with ordinality as x(teste, passou, ordem);
end;
$$;

select
  ordem as "#",
  case when passou then '✅' else '❌' end as ok,
  teste
from _resultado_parcelas
order by ordem;
