# Minhas Finanças

Organizador financeiro pessoal: lançamentos, parcelas, metas e investimentos, salvos direto no
banco (Supabase) para nunca mais perder dados. O plano completo está em [PLANO.md](PLANO.md).

**Stack:** React + Vite + TypeScript · Tailwind CSS · React Router · TanStack Query ·
react-hook-form + zod · Recharts · Supabase (Auth + Postgres + RLS) · Vercel.

## Rodando localmente

Requisitos: Node.js 20 ou superior.

```bash
npm install
cp .env.example .env.local   # no Windows/PowerShell: copy .env.example .env.local
# preencha o .env.local (passo a passo abaixo)
npm run dev                  # abre em http://localhost:5173
```

| Comando           | O que faz                            |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Servidor de desenvolvimento          |
| `npm run build`   | Checa os tipos e gera a versão final |
| `npm run lint`    | ESLint                               |
| `npm run format`  | Formata o código com Prettier        |
| `npm run preview` | Serve a versão gerada pelo `build`   |

## Configurando o Supabase (uma vez só)

1. Acesse <https://supabase.com> e clique em **Start your project** (entre com o GitHub ou e-mail).
2. No painel, clique em **New project**.
   - **Organization**: a sua (é criada no primeiro acesso).
   - **Project name**: `minhas-financas`.
   - **Database Password**: clique em **Generate a password** e **guarde essa senha** num lugar
     seguro (gerenciador de senhas). Ela não vai no app, mas é necessária para usar o Supabase CLI.
   - **Region**: **South America (São Paulo)**.
   - Clique em **Create new project** e espere 1 a 2 minutos.
3. Com o projeto pronto, clique no botão **Connect** no topo da página. No painel que abre,
   deixe **Framework** e escolha **Next.js** (qualquer um serve; só interessa a aba `.env.local`
   do passo 2 "Add files"). Você verá duas linhas:
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
4. Copie os valores para o `.env.local` **trocando os nomes** (este projeto usa Vite, não Next.js):
   - `NEXT_PUBLIC_SUPABASE_URL` → `VITE_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → `VITE_SUPABASE_ANON_KEY` (a _publishable key_
     é a nova versão da anon key e funciona do mesmo jeito)
5. **Não copie a `service_role` / `secret` key.** Ela ignora todas as regras de segurança e
   nunca deve ir para o front-end nem para o repositório.
6. Reinicie o `npm run dev`. O aviso amarelo "Supabase não configurado" deve sumir.

> O `.env.local` está no `.gitignore` e não vai para o Git. O `.env.example` é só um modelo.

## Banco de dados

O banco é criado pelos arquivos de [supabase/migrations/](supabase/migrations/), **na ordem do nome**:

1. `20261121120000_schema_inicial.sql`: tabelas, RLS, triggers (updated_at, status, auditoria),
   view `resumo_mensal` e a função `gerar_parcelas`.
2. `20261121120100_categorias_padrao.sql`: categorias padrão criadas no cadastro.

Para rodar: no painel do Supabase, menu lateral **SQL Editor** → **New query** → cole o conteúdo
do arquivo → **Run** (ou Ctrl+Enter). Deve aparecer "Success. No rows returned".

### Testando o isolamento entre usuários

Cole [supabase/tests/rls_dois_usuarios.sql](supabase/tests/rls_dois_usuarios.sql) no SQL Editor
e rode. Ele cria 2 usuários fictícios, tenta fazer um ler/alterar/apagar os dados do outro,
apaga tudo no final e mostra uma tabela com ✅/❌ por teste. Todos devem estar ✅.

### Como o banco protege os dados

- **RLS** em todas as tabelas: cada usuário só lê e altera linhas com `user_id = auth.uid()`.
- **FKs compostas** `(x_id, user_id)`: impossível ligar um lançamento à categoria/compra/meta de outro usuário.
- **Lixeira**: as tabelas têm `deleted_at`; o app marca em vez de apagar.
- **Histórico**: todo insert/update/delete vai para `historico` (antes e depois em JSON).
  O usuário só consegue **ler** o próprio histórico.
- **Status coerente**: um trigger acerta `valor_pago` conforme o status
  (`pago` = valor total, `pendente` = 0, `parcial` = valor informado, entre 0 e o total).

### Tipos TypeScript

[src/types/db.ts](src/types/db.ts) espelha o banco e é escrito à mão. Ao alterar uma migration,
atualize-o junto. (Alternativa: `npx supabase login` + `npx supabase gen types typescript --project-id <id>`,
mas o gerador troca as uniões como `'pago' | 'pendente'` por `string`.)

## Estrutura

```
src/
  components/      componentes compartilhados (layout, estados vazios...)
  features/        um módulo por área: auth, dashboard, lancamentos, parcelas,
                   metas, investimentos, configuracoes
  lib/             supabase.ts, queryClient.ts, format.ts (dinheiro e datas pt-BR)
  types/db.ts      tipos do banco
supabase/
  migrations/      SQL versionado do banco
  tests/           scripts de verificação (rodar no SQL Editor)
```

## Regras de dinheiro

- No banco: `numeric(12,2)`. O supabase-js entrega como `number`.
- No front: some com `somar()` e arredonde com `round2()` de [src/lib/format.ts](src/lib/format.ts),
  nunca com float solto. Mostre com `formatBRL()`.
- Entrada do usuário: `parseValor()` aceita vírgula ou ponto (`"1.234,56"`).
