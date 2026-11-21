-- =====================================================================
-- Excluir a própria conta (LGPD: direito de eliminação)
-- =====================================================================
-- Apaga, de uma vez e para sempre, todos os dados do usuário logado e a própria
-- conta de acesso. Tudo numa transação: ou apaga tudo, ou não apaga nada.
--
-- `security definer` porque o cliente não pode apagar de `historico` nem de
-- `auth.users`. A função só age sobre `auth.uid()`: ninguém consegue apagar
-- a conta de outra pessoa.

create function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;

  -- Ordem: primeiro quem aponta para os outros (chaves estrangeiras compostas).
  delete from public.lancamentos where user_id = v_user;
  delete from public.meta_movimentos where user_id = v_user;
  delete from public.investimentos where user_id = v_user;
  delete from public.compras_parceladas where user_id = v_user;
  delete from public.metas where user_id = v_user;
  delete from public.categorias where user_id = v_user;
  delete from public.perfis where user_id = v_user;
  -- Por último o histórico (inclui as linhas que a auditoria acabou de gravar acima).
  delete from public.historico where user_id = v_user;
  -- E a conta de acesso (sessões e identidades vão junto, em cascata).
  delete from auth.users where id = v_user;
end;
$$;

revoke execute on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
