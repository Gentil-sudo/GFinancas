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
3. Com o projeto pronto, clique no botão **Connect** no topo da página (ou vá em
   **Project Settings → API Keys** / **Data API**).
4. Copie os dois valores para o `.env.local`:
   - **Project URL** → `VITE_SUPABASE_URL` (algo como `https://abcdefgh.supabase.co`)
   - **anon public** key (pode aparecer como **Publishable key**) → `VITE_SUPABASE_ANON_KEY`
5. **Não copie a `service_role` / `secret` key.** Ela ignora todas as regras de segurança e
   nunca deve ir para o front-end nem para o repositório.
6. Reinicie o `npm run dev`. O aviso amarelo "Supabase não configurado" deve sumir.

> O `.env.local` está no `.gitignore` e não vai para o Git. O `.env.example` é só um modelo.

## Estrutura

```
src/
  components/      componentes compartilhados (layout, estados vazios...)
  features/        um módulo por área: auth, dashboard, lancamentos, parcelas,
                   metas, investimentos, configuracoes
  lib/             supabase.ts, queryClient.ts, format.ts (dinheiro e datas pt-BR)
  types/           tipos do banco (Fase 2)
supabase/
  migrations/      SQL versionado do banco (Fase 2)
```

## Regras de dinheiro

- No banco: `numeric(12,2)`. O Postgres devolve como texto; converta com `Number()`.
- No front: some com `somar()` e arredonde com `round2()` de [src/lib/format.ts](src/lib/format.ts),
  nunca com float solto. Mostre com `formatBRL()`.
- Entrada do usuário: `parseValor()` aceita vírgula ou ponto (`"1.234,56"`).
