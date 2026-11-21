-- =====================================================================
-- Minhas Finanças — categorias padrão
--
-- Rode DEPOIS de 20261121120000_schema_inicial.sql.
--
-- As categorias são criadas de duas formas (as duas são seguras de repetir):
--   1. Trigger em auth.users: assim que alguém se cadastra.
--   2. RPC seed_categorias_padrao(): o app chama no login, para cobrir contas
--      criadas antes desta migration.
-- Só cria se o usuário ainda não tiver nenhuma categoria, para não "ressuscitar"
-- categorias que ele renomeou ou apagou.
-- =====================================================================

create function private.seed_categorias(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.categorias where user_id = p_user) then
    return;
  end if;

  insert into public.categorias (user_id, nome, tipo, cor, icone) values
    (p_user, 'Salário',     'entrada', '#059669', 'briefcase'),
    (p_user, 'Rendimentos', 'entrada', '#0d9488', 'trending-up'),
    (p_user, 'Outros',      'entrada', '#64748b', 'circle-plus'),
    (p_user, 'Moradia',     'saida',   '#7c3aed', 'house'),
    (p_user, 'Mercado',     'saida',   '#ea580c', 'shopping-cart'),
    (p_user, 'Transporte',  'saida',   '#0284c7', 'car'),
    (p_user, 'Faculdade',   'saida',   '#4f46e5', 'graduation-cap'),
    (p_user, 'Saúde',       'saida',   '#e11d48', 'heart-pulse'),
    (p_user, 'Lazer',       'saida',   '#db2777', 'party-popper'),
    (p_user, 'Assinaturas', 'saida',   '#9333ea', 'repeat'),
    (p_user, 'Cartão',      'saida',   '#475569', 'credit-card'),
    (p_user, 'Móveis',      'saida',   '#a16207', 'sofa'),
    (p_user, 'Casamento',   'saida',   '#be185d', 'gem'),
    (p_user, 'Outros',      'saida',   '#64748b', 'circle-ellipsis')
  on conflict (user_id, nome, tipo) do nothing;
end;
$$;

-- 1. Trigger no cadastro
create function private.handle_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.seed_categorias(new.id);
  return new;
end;
$$;

create trigger on_auth_user_created_seed_categorias
  after insert on auth.users
  for each row execute function private.handle_novo_usuario();

-- 2. RPC chamada pelo app (usa o usuário logado; não aceita id de terceiros)
create function public.seed_categorias_padrao()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado' using errcode = '42501';
  end if;
  perform private.seed_categorias(auth.uid());
end;
$$;

revoke execute on function public.seed_categorias_padrao() from public, anon;
grant execute on function public.seed_categorias_padrao() to authenticated;
