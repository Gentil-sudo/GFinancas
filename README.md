# Minhas Finanças

Organizador financeiro pessoal: lançamentos, parcelas, metas e investimentos, salvos direto no
banco (Supabase) para nunca mais perder dados.

**Stack:** React + Vite + TypeScript · Tailwind CSS · React Router · TanStack Query ·
react-hook-form + zod · Recharts · write-excel-file (backup .xlsx) · vite-plugin-pwa ·
Supabase (Auth + Postgres + RLS) · Cloudflare Turnstile · Vercel.

## Uso de IA

Usei ferramentas de IA para acelerar a escrita do código e da documentação. As decisões são
minhas: o que o app faz, as regras de dinheiro, como os dados ficam protegidos (RLS no banco e
captcha do Cloudflare Turnstile ligado ao Supabase) e a ordem em que cada parte foi construída.

## Rodando localmente

Requisitos: Node.js 20 ou superior.

```bash
npm install
cp .env.example .env.local   # no Windows/PowerShell: copy .env.example .env.local
# preencha o .env.local (passo a passo abaixo)
npm run dev                  # abre em http://localhost:5173
```

| Comando           | O que faz                                             |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento                           |
| `npm run build`   | Checa os tipos e gera a versão final                  |
| `npm run lint`    | ESLint                                                |
| `npm run format`  | Formata o código com Prettier                         |
| `npm run preview` | Serve a versão gerada pelo `build`                    |
| `npm run icones`  | Regera os ícones do app a partir de `public/logo.svg` |

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
   deixe **Framework** e escolha **React** com **Vite**. Na aba `.env.local` do passo
   "Add files" aparecem duas linhas:
   - `VITE_SUPABASE_URL=https://....supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
4. Copie essas duas linhas, do jeito que estão, para o seu `.env.local`. Ignore o resto do
   painel (instalação de pacotes e arquivos de exemplo): o cliente já está em
   [src/lib/supabase.ts](src/lib/supabase.ts).
5. **Não copie a `service_role` / `secret` key.** Ela ignora todas as regras de segurança e
   nunca deve ir para o front-end nem para o repositório.
6. Reinicie o `npm run dev`. O aviso amarelo "Supabase não configurado" deve sumir.

> O `.env.local` está no `.gitignore` e não vai para o Git. O `.env.example` é só um modelo.

## Autenticação (links de e-mail)

Os e-mails de confirmação de cadastro e de "esqueci minha senha" trazem um link que precisa
voltar para o app. No painel do Supabase:

1. Menu lateral **Authentication** → **URL Configuration**.
2. **Site URL**: `http://localhost:5173` → **Save changes**.
3. **Redirect URLs** → **Add URL** → `http://localhost:5173/**` → **Save URLs**.

Quando o app for para a Vercel (Fase 7), troque a Site URL pelo domínio da Vercel e adicione
`https://SEU-DOMINIO.vercel.app/**` nas Redirect URLs (mantenha a do localhost para desenvolver).

> O serviço de e-mail embutido do Supabase envia **poucos e-mails por hora** (bom para testes,
> não para uso intenso). Se aparecer "Limite de e-mails atingido", espere um pouco.

## Banco de dados

O banco é criado pelos arquivos de [supabase/migrations/](supabase/migrations/), **na ordem do nome**:

1. `20261121120000_schema_inicial.sql`: tabelas, RLS, triggers (updated_at, status, auditoria),
   view `resumo_mensal` e a função `gerar_parcelas`.
2. `20261121120100_categorias_padrao.sql`: categorias padrão criadas no cadastro.
3. `20261121130000_perfis.sql`: perfil do usuário (nome do "Olá" e tema escolhido).
4. `20261121140000_compras_parceladas_rpc.sql`: criar/editar/cancelar compras parceladas numa
   transação só (nunca fica uma compra pela metade).
5. `20261121150000_excluir_conta.sql`: "Excluir minha conta" (apaga todos os dados e a conta).

Cada arquivo roda **uma vez só**. Quando chegar uma migration nova, rode só ela.

Para rodar: no painel do Supabase, menu lateral **SQL Editor** → **New query** → cole o conteúdo
do arquivo → **Run** (ou Ctrl+Enter). Deve aparecer "Success. No rows returned".

### Testes no SQL Editor

- [supabase/tests/rls_dois_usuarios.sql](supabase/tests/rls_dois_usuarios.sql): isolamento entre usuários.
- [supabase/tests/compras_parceladas.sql](supabase/tests/compras_parceladas.sql): criar, editar, cancelar e desfazer compras.
- [supabase/tests/excluir_conta.sql](supabase/tests/excluir_conta.sql): excluir a conta apaga tudo de um usuário e nada do outro.

Todos criam usuários fictícios, testam e apagam tudo no final.

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

## Temas

Três temas (Clareza, Noite, Lavanda) + Automático, escolhidos em **Configurações → Aparência**.
As cores ficam só em [src/index.css](src/index.css), como variáveis por
`[data-theme]`; os componentes usam apenas os tokens (`bg-surface`, `text-muted`, `bg-primary`…).
A escolha é salva no perfil (Supabase) e no navegador (para não piscar ao abrir).

## Publicar na Vercel

1. Crie um repositório **privado** no GitHub e envie o projeto (`git remote add origin ...` e
   `git push -u origin main`). O `.env.local` não vai junto (está no `.gitignore`).
2. Em <https://vercel.com> → **Add New… → Project** → importe o repositório.
   A Vercel detecta Vite sozinha (as configurações estão em [vercel.json](vercel.json)).
3. Antes de clicar em **Deploy**, abra **Environment Variables** e cadastre:
   - `VITE_SUPABASE_URL` = a mesma do `.env.local`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = a mesma do `.env.local`
4. **Deploy**. Anote o endereço (ex.: `https://minhas-financas-xyz.vercel.app`).
5. No Supabase → **Authentication → URL Configuration**:
   - **Site URL**: o endereço da Vercel.
   - **Redirect URLs**: adicione `https://SEU-ENDERECO.vercel.app/**` (mantenha o do localhost).
6. Se o app for **só seu**: **Authentication → Sign In / Providers → Email** → desligue
   **Allow new users to sign up**. Se for abrir para outras pessoas, veja a seção abaixo.

A cada `git push` na `main`, a Vercel publica a versão nova. O app avisa "Nova versão
disponível — Atualizar" (não recarrega sozinho para não perder um formulário aberto).

## Abrir para amigos e família

Cada pessoa cria a própria conta e só vê os próprios dados (garantido pelo RLS). Para isso
funcionar de verdade, faça estes passos **nesta ordem**:

### 1. E-mail próprio (obrigatório)

O e-mail embutido do Supabase **só envia para os membros do seu time no Supabase**: os outros
não receberiam a confirmação de cadastro nem o "esqueci a senha". Use um SMTP próprio.

**Opção simples (Gmail):**

1. Crie uma conta Gmail só para o app (ex.: `minhasfinancas.app@gmail.com`).
2. Ative a **verificação em 2 etapas** dela e crie uma **senha de app** em
   <https://myaccount.google.com/apppasswords>.
3. Supabase → **Authentication → Emails → SMTP Settings** → **Enable custom SMTP**:
   - Sender email: o Gmail criado · Sender name: `Minhas Finanças`
   - Host: `smtp.gmail.com` · Port: `587`
   - Username: o Gmail criado · Password: a senha de app (16 letras)
4. Em **Authentication → Rate Limits**, ajuste "emails sent per hour" (ex.: 30).

O Gmail envia até ~500 e-mails por dia: sobra para amigos e família.

**Opção profissional (depois):** domínio próprio + Resend/Brevo. A Resend só envia para qualquer
pessoa depois que você verifica um domínio seu.

### 2. E-mails em português

Supabase → **Authentication → Emails → Templates**:

- **Confirm signup**: assunto `Confirme seu cadastro no Minhas Finanças`, corpo =
  [supabase/templates/confirmar-cadastro.html](supabase/templates/confirmar-cadastro.html).
- **Reset password**: assunto `Crie uma nova senha no Minhas Finanças`, corpo =
  [supabase/templates/redefinir-senha.html](supabase/templates/redefinir-senha.html).

### 3. Cadastro aberto, com confirmação

**Authentication → Sign In / Providers → Email**: **Allow new users to sign up** ligado,
**Confirm email** ligado, **Minimum password length** = 8.

### 4. Excluir conta (LGPD)

Rode a migration `20261121150000_excluir_conta.sql` no SQL Editor (e, se quiser, o teste
[supabase/tests/excluir_conta.sql](supabase/tests/excluir_conta.sql)). O botão fica em
Configurações → **Excluir minha conta**. A página [/privacidade](src/features/legal/PrivacidadePage.tsx)
explica o que é guardado; o cadastro exige aceitar esse texto.

### 5. Anti-robô (Cloudflare Turnstile, grátis)

1. <https://dash.cloudflare.com> → **Turnstile** → **Add widget**: hostnames
   `gfinc.vercel.app` e `localhost`, modo **Managed**. Anote a **Site Key** e a **Secret Key**.
2. Vercel → **Environment Variables** → `VITE_TURNSTILE_SITE_KEY` = Site Key → **Redeploy**.
   Coloque a mesma linha no `.env.local` para desenvolver.
3. **Só depois do deploy**: Supabase → **Authentication → Attack Protection** → **Enable Captcha
   protection** → provedor **Turnstile** → cole a **Secret Key**.

A ordem importa: se o Supabase exigir captcha antes de o site ter a Site Key, ninguém consegue
entrar.

### 6. Contato (opcional)

`VITE_CONTATO_EMAIL` na Vercel aparece na página de privacidade como canal para dúvidas e
pedidos sobre dados. Sem ela, a página diz para falar com quem convidou.

### Limites do plano grátis

- **Supabase Free:** 500 MB (cada pessoa usa bem menos de 1 MB por ano) e 50 mil usuários.
  O projeto **pausa após 7 dias sem nenhum uso** (é só reativar no painel) e **não tem backup
  automático**: o backup de cada pessoa fica na tela de Backup.
- **Vercel Hobby:** só para uso **não comercial**. Se um dia cobrar, mude para o plano Pro.

## Instalar no celular (PWA)

- **Android (Chrome):** abra o endereço da Vercel → menu ⋮ → **Instalar app** (ou
  "Adicionar à tela inicial").
- **iPhone (Safari):** abra o endereço → botão **Compartilhar** → **Adicionar à Tela de Início**.

O app abre em tela cheia, com o ícone "Finanças". Sem internet ele abre, mas avisa e não deixa
salvar (os dados vivem só no Supabase, nunca "só no celular").
