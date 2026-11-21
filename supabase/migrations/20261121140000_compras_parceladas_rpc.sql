-- =====================================================================
-- Minhas Finanças — operações de compras parceladas (Fase 5)
--
-- Cada operação roda numa transação só: ou tudo é salvo, ou nada
-- (nunca fica uma compra sem parcelas ou parcelas pela metade).
-- Todas são `security invoker`: valem as mesmas regras de RLS de quem chama.
--
-- Rode DEPOIS das migrations anteriores.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Criar compra + gerar as parcelas.
--   p_parcela_atual: para compras já em andamento ("estou na parcela 4 de 12"):
--   gera só da parcela atual em diante. Padrão 1 = compra nova.
-- Retorna o id da compra.
-- ---------------------------------------------------------------------
create function public.criar_compra_parcelada(
  p_descricao text,
  p_valor_parcela numeric,
  p_total_parcelas int,
  p_primeira_competencia date,
  p_dia_vencimento int default null,
  p_categoria_id uuid default null,
  p_meta_id uuid default null,
  p_observacao text default null,
  p_parcela_atual int default 1
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.compras_parceladas (
    descricao, valor_parcela, total_parcelas, primeira_competencia,
    dia_vencimento, categoria_id, meta_id, observacao
  ) values (
    trim(p_descricao), p_valor_parcela, p_total_parcelas, p_primeira_competencia,
    p_dia_vencimento, p_categoria_id, p_meta_id, nullif(trim(p_observacao), '')
  )
  returning id into v_id;

  perform public.gerar_parcelas(v_id, p_parcela_atual);
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Editar compra.
--   p_incluir_pagas = false (padrão): descrição, categoria, valor e vencimento mudam
--   só nas parcelas ainda não pagas. true: em todas.
--   Mudar o total: diminuir apaga (lixeira) as parcelas não pagas além do novo total;
--   aumentar gera as que faltam. O mês da 1ª parcela não muda aqui.
-- ---------------------------------------------------------------------
create function public.atualizar_compra_parcelada(
  p_compra_id uuid,
  p_descricao text,
  p_valor_parcela numeric,
  p_total_parcelas int,
  p_dia_vencimento int default null,
  p_categoria_id uuid default null,
  p_meta_id uuid default null,
  p_observacao text default null,
  p_incluir_pagas boolean default false
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_maior_paga int;
  v_maior int;
begin
  perform 1 from public.compras_parceladas
  where id = p_compra_id and deleted_at is null
  for update;
  if not found then
    raise exception 'Compra parcelada não encontrada' using errcode = 'P0002';
  end if;

  select max(numero_parcela) into v_maior_paga
  from public.lancamentos
  where compra_parcelada_id = p_compra_id and deleted_at is null and status <> 'pendente';

  if v_maior_paga is not null and p_total_parcelas < v_maior_paga then
    raise exception 'A parcela % já foi paga: o total não pode ser menor que %.',
      v_maior_paga, v_maior_paga using errcode = '22023';
  end if;

  update public.compras_parceladas set
    descricao = trim(p_descricao),
    valor_parcela = p_valor_parcela,
    total_parcelas = p_total_parcelas,
    dia_vencimento = p_dia_vencimento,
    categoria_id = p_categoria_id,
    meta_id = p_meta_id,
    observacao = nullif(trim(p_observacao), '')
  where id = p_compra_id;

  -- Parcelas além do novo total (só não pagas, garantido acima) vão para a lixeira.
  update public.lancamentos set deleted_at = now()
  where compra_parcelada_id = p_compra_id and deleted_at is null
    and numero_parcela > p_total_parcelas;

  -- O "(n/N)" da descrição acompanha o total em todas as parcelas.
  update public.lancamentos l set
    descricao = format('%s (%s/%s)',
      case when l.status = 'pendente' or p_incluir_pagas
        then trim(p_descricao)
        else regexp_replace(l.descricao, ' \(\d+/\d+\)$', '')
      end,
      l.numero_parcela, p_total_parcelas)
  where l.compra_parcelada_id = p_compra_id and l.deleted_at is null;

  -- Categoria, valor e vencimento: nas não pagas (ou em todas, se pedido).
  -- Parcelas "parcial" mantêm o valor (já há um pagamento registrado nele).
  update public.lancamentos l set
    categoria_id = p_categoria_id,
    valor = case when l.status = 'parcial' then l.valor else p_valor_parcela end,
    vencimento = case
      when p_dia_vencimento is null then null
      else l.competencia + (least(
        p_dia_vencimento,
        extract(day from (l.competencia + interval '1 month' - interval '1 day'))::int
      ) - 1)
    end
  where l.compra_parcelada_id = p_compra_id and l.deleted_at is null
    and (l.status <> 'pago' or p_incluir_pagas);

  -- Total aumentou: gera as parcelas novas (depois da maior existente).
  select max(numero_parcela) into v_maior
  from public.lancamentos
  where compra_parcelada_id = p_compra_id and deleted_at is null;

  if coalesce(v_maior, 0) < p_total_parcelas then
    perform public.gerar_parcelas(p_compra_id, coalesce(v_maior, 0) + 1);
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Cancelar compra: a compra e as parcelas NÃO pagas vão para a lixeira;
-- as pagas continuam (são histórico do que você gastou).
-- Retorna o instante usado, para o "Desfazer" (restaurar_compra_parcelada).
-- ---------------------------------------------------------------------
create function public.cancelar_compra_parcelada(p_compra_id uuid)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  -- clock_timestamp (e não now()): identifica SÓ o que este cancelamento apagou,
  -- mesmo que outra operação tenha apagado parcelas na mesma transação.
  v_quando timestamptz := clock_timestamp();
begin
  update public.compras_parceladas set deleted_at = v_quando
  where id = p_compra_id and deleted_at is null;
  if not found then
    raise exception 'Compra parcelada não encontrada' using errcode = 'P0002';
  end if;

  update public.lancamentos set deleted_at = v_quando
  where compra_parcelada_id = p_compra_id and deleted_at is null and status = 'pendente';

  return v_quando;
end;
$$;

-- Desfaz um cancelamento: restaura só o que foi apagado naquele instante.
create function public.restaurar_compra_parcelada(p_compra_id uuid, p_quando timestamptz)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.compras_parceladas set deleted_at = null
  where id = p_compra_id and deleted_at = p_quando;
  if not found then
    raise exception 'Nada para restaurar' using errcode = 'P0002';
  end if;

  update public.lancamentos set deleted_at = null
  where compra_parcelada_id = p_compra_id and deleted_at = p_quando;
end;
$$;

revoke execute on function
  public.criar_compra_parcelada(text, numeric, int, date, int, uuid, uuid, text, int),
  public.atualizar_compra_parcelada(uuid, text, numeric, int, int, uuid, uuid, text, boolean),
  public.cancelar_compra_parcelada(uuid),
  public.restaurar_compra_parcelada(uuid, timestamptz)
from public, anon;

grant execute on function
  public.criar_compra_parcelada(text, numeric, int, date, int, uuid, uuid, text, int),
  public.atualizar_compra_parcelada(uuid, text, numeric, int, int, uuid, uuid, text, boolean),
  public.cancelar_compra_parcelada(uuid),
  public.restaurar_compra_parcelada(uuid, timestamptz)
to authenticated;
