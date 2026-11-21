# PLANO — Organizador Financeiro Pessoal (React + Supabase)

> Plano para o Claude Code executar. Leia o documento inteiro antes de começar.
> Trabalhe **uma fase por vez**. Ao terminar cada fase, pare, mostre o que foi feito e diga como testar. Só siga para a próxima fase quando eu aprovar.

---

## 0. Contexto e objetivo

Eu controlava minhas finanças numa planilha Excel e **perdi várias atualizações** (o arquivo voltou para uma versão antiga). O objetivo deste site é:

1. **Nunca mais perder dados**: cada lançamento é salvo no banco na hora, com confirmação visual. Nada fica "só na tela".
2. **Ser fácil de usar e de acessar**: funcionar bem no celular e no computador, com login e senha, e poder ser instalado como app (PWA).
3. **Reproduzir o que minha planilha fazia**, só que de forma organizada.

### Como a planilha atual funciona (para referência)

Uma aba por mês (Junho, Julho, Agosto, Setembro...), cada uma com:

- **Entradas**: valores recebidos no mês (salário e pequenos rendimentos).
- **Saídas**: gastos do mês.
- **Pagamentos**: o que já foi efetivamente pago. Às vezes difere de "Saídas" (por exemplo, paguei só parte de uma conta).
- **Res. Mês** = Entradas − Pagamentos.
- **Investido por tipo**: Ações, Fundos, ETF, Exterior (em dólar, convertido com uma cotação digitada à mão, ex.: 10 × 4,98), Renda Fixa.
- **TOTAL** = Resultado do mês + Total investido.
- **Grade de parcelas**: uma tabela Junho→Maio mostrando quanto de cada compra parcelada cai em cada mês (ex.: 58,21 por 6 meses, 135,00 por 12 meses, 287,30 por 8 a 9 meses), com o total por mês.
- **Caixinhas/metas**: "MÓVEIS" (parcelas de móveis) e "CASAMENTO" (aporte mensal de 2.666,00 de ago/2026 até jan/2028, com retiradas/pagamentos descontados mês a mês).

**Problema importante da planilha**: os valores **não têm descrição**. Ninguém sabe o que é "393,22". No site, todo lançamento **precisa** ter descrição e categoria.

> Não importar a planilha automaticamente: ela está desatualizada e os valores não têm descrição. Eu vou cadastrar meu estado atual à mão (ver Fase 6, "Configuração inicial").

> **A planilha serve só como referência de QUAIS dados e cálculos existem. A interface NÃO deve imitar a planilha.** Nada de telas que sejam grandes tabelas de números. Use a forma mais clara de visualizar cada informação: cards, listas agrupadas, barras de progresso, linhas do tempo e gráficos (ver seção 4.0). Tabela só como visão secundária e opcional, para quem quiser o detalhe.

---

## 1. Stack

| Camada | Escolha |
|---|---|
| Front-end | React + Vite + TypeScript |
| UI | Tailwind CSS + shadcn/ui (ou componentes próprios simples) |
| Formulários | react-hook-form + zod |
| Dados/cache | @tanstack/react-query |
| Gráficos | Recharts |
| Backend | Supabase (Auth + Postgres + Row Level Security) |
| Deploy | Vercel |
| PWA | vite-plugin-pwa |
| Datas e dinheiro | date-fns (locale pt-BR) e `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` |

Regras gerais:
- Idioma da interface: **português (Brasil)**. Moeda BRL, datas dd/mm/aaaa.
- **Valores em dinheiro**: guardar como `numeric(12,2)` no banco. No front, nunca somar com float solto: arredondar sempre a 2 casas.
- Mobile-first.
- Código organizado em `src/features/<modulo>` (lancamentos, parcelas, metas, investimentos, dashboard, auth).

---

## 2. Segurança (obrigatório)

- Usar apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no front. **Nunca** colocar a `service_role` key no front-end nem no repositório.
- Criar `.env.local` (no `.gitignore`) e `.env.example` (sem valores reais).
- **RLS ativado em todas as tabelas**, com policies `user_id = auth.uid()` para select/insert/update/delete.
- `user_id` com default `auth.uid()`, para o front não precisar enviar.
- Rotas internas protegidas: quem não está logado vai para `/login`.

---

## 3. Modelo de dados (Supabase / Postgres)

Criar como **migrations SQL versionadas** em `supabase/migrations/` (usar Supabase CLI se disponível; senão gerar o `.sql` para eu colar no SQL Editor).

```sql
-- Categorias (ex.: Mercado, Transporte, Faculdade, Salário, Móveis...)
create table categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('entrada','saida')),
  cor text,
  icone text,
  arquivada boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, nome, tipo)
);

-- Compras parceladas / contas recorrentes
create table compras_parceladas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  descricao text not null,
  categoria_id uuid references categorias,
  valor_parcela numeric(12,2) not null check (valor_parcela > 0),
  total_parcelas int not null check (total_parcelas > 0),
  primeira_competencia date not null,   -- sempre dia 1 do mês da 1ª parcela
  dia_vencimento int check (dia_vencimento between 1 and 31),
  meta_id uuid,                         -- opcional: parcela ligada a uma meta (ex.: Móveis)
  observacao text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lançamentos: tudo que entra ou sai
create table lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  tipo text not null check (tipo in ('entrada','saida')),
  descricao text not null check (length(trim(descricao)) > 0),
  categoria_id uuid references categorias,
  valor numeric(12,2) not null check (valor > 0),
  competencia date not null,            -- dia 1 do mês ao qual pertence
  data date not null default current_date,
  vencimento date,
  status text not null default 'pendente' check (status in ('pendente','pago','parcial')),
  valor_pago numeric(12,2) not null default 0 check (valor_pago >= 0),
  data_pagamento date,
  compra_parcelada_id uuid references compras_parceladas on delete set null,
  numero_parcela int,
  observacao text,
  deleted_at timestamptz,               -- soft delete (lixeira)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on lancamentos (user_id, competencia) where deleted_at is null;

-- Metas / caixinhas (Casamento, Móveis...)
create table metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  valor_alvo numeric(12,2),
  aporte_mensal_planejado numeric(12,2),
  inicio date,
  fim date,
  cor text,
  arquivada boolean not null default false,
  created_at timestamptz not null default now()
);
alter table compras_parceladas add constraint fk_meta foreign key (meta_id) references metas;

create table meta_movimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  meta_id uuid not null references metas on delete cascade,
  tipo text not null check (tipo in ('aporte','retirada')),
  valor numeric(12,2) not null check (valor > 0),
  competencia date not null,
  descricao text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Investimentos: snapshot de saldo por tipo e mês
create table investimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  tipo text not null check (tipo in ('acoes','fundos','etf','exterior','renda_fixa','outros')),
  descricao text,
  competencia date not null,
  moeda text not null default 'BRL' check (moeda in ('BRL','USD')),
  valor numeric(14,2) not null,
  cotacao numeric(10,4),                -- usado quando moeda = USD (digitada à mão)
  valor_brl numeric(14,2) generated always as
    (case when moeda = 'USD' then round(valor * coalesce(cotacao,0), 2) else valor end) stored,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Histórico/auditoria: toda alteração fica registrada (proteção contra perda)
create table historico (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('insert','update','delete')),
  antes jsonb,
  depois jsonb,
  created_at timestamptz not null default now()
);
```

Também criar:
- **Trigger `updated_at`** nas tabelas com essa coluna.
- **Trigger de auditoria** (função `security definer`) em `lancamentos`, `compras_parceladas`, `meta_movimentos` e `investimentos`, gravando em `historico`. A tabela `historico` só aceita **select** do próprio usuário (sem update/delete pelo cliente).
- **RLS + policies** em todas as tabelas.
- **View `resumo_mensal`** (com `security_invoker = true`) por `user_id` + `competencia`: total de entradas, total de saídas, total pago, total pendente, resultado (entradas − pago), total investido (soma de `valor_brl` do mês) e TOTAL (resultado + investido).
- **Função RPC `gerar_parcelas(compra_id)`**: ao criar uma compra parcelada, gera automaticamente N lançamentos de saída (um por mês, com `numero_parcela` e descrição tipo "Sofá (3/12)").
- **Seed de categorias padrão** criadas no primeiro login (função chamada pelo front, ou trigger em `auth.users`): Salário, Rendimentos, Outros (entrada); Moradia, Mercado, Transporte, Faculdade, Saúde, Lazer, Assinaturas, Cartão, Móveis, Casamento, Outros (saída).

---

## 4. Telas e funcionalidades

### 4.0 Princípios de interface (valem para todas as telas)

- **Responder uma pergunta por bloco.** Cada card ou gráfico deve responder algo que eu realmente pergunto: "Quanto sobra este mês?", "O que ainda falta pagar?", "Quando acabam minhas parcelas?", "Quanto falta para a meta do casamento?". Se um bloco não responde a uma pergunta, ele não entra.
- **Do resumo para o detalhe.** Primeiro o número principal, grande e legível; depois o contexto (barra de progresso, comparação com o mês anterior); por último o detalhe (lista), que abre ao tocar.
- **Listas no estilo app de banco**, não tabelas: agrupadas por dia ou por vencimento, com ícone e cor da categoria, descrição em destaque e valor alinhado à direita.
- **Progresso visual** para tudo que tem começo e fim: parcelas ("4 de 12"), metas (%) e contas do mês (pago × falta pagar).
- **Cores com significado** e consistentes: verde = entrada/positivo, vermelho = saída/negativo, âmbar = pendente/vencendo, cinza = pago/concluído. Nunca depender só da cor: sempre acompanhar de texto ou ícone.
- **Gráficos simples**: barras para comparar, linha para evolução no tempo, rosca só para composição com poucas fatias (no máximo 6; o resto vira "Outros"). Sempre com valores legíveis no toque/hover.
- **Mobile primeiro**: no celular, um bloco por linha, botões grandes, ações por toque (e deslizar para o lado para "pagar" e "excluir" nas listas).
- **Estados vazios que ensinam**: em vez de tela em branco, uma frase e um botão ("Nenhuma parcela ainda. Cadastre sua primeira compra parcelada").
- **Pouca digitação**: valores sugeridos, autocomplete de descrição, "copiar do mês anterior", mês atual como padrão.

### 4.1 Autenticação
- Cadastro (e-mail + senha), login, "esqueci minha senha" (reset por e-mail do Supabase), logout.
- Manter sessão (não pedir login toda hora).
- Mensagens de erro em português.

### 4.2 Dashboard (tela inicial), por mês
- Seletor de mês no topo (← Novembro 2026 →), com gesto de deslizar no celular.
- **Card principal (destaque)**: "Sobra do mês" (resultado) em número grande, e abaixo, menores, Entradas e Saídas, com uma setinha comparando com o mês anterior.
- **Barra "Contas do mês"**: uma única barra mostrando pago × falta pagar ("R$ 1.850 pagos · faltam R$ 620"), que abre a lista de pendentes ao tocar.
- **Próximos vencimentos**: lista curta (próximos 7 dias e vencidas em destaque âmbar/vermelho), com botão **Pagar** em 1 toque.
- **Para onde foi o dinheiro**: barras horizontais por categoria, ordenadas do maior para o menor (mais legível que pizza), com % do total.
- **Patrimônio**: card pequeno com o total investido, o saldo das metas e o TOTAL (sobra + investido), com link para as telas de detalhe.
- **Evolução**: gráfico de barras dos últimos 6 a 12 meses (entradas × saídas) com a linha do resultado.
- Botão flutuante **"+"** sempre visível para um lançamento rápido.

### 4.3 Lançamentos
- Formulário rápido: tipo (entrada/saída), valor, descrição (**obrigatória**), categoria, data, mês de competência (padrão: mês atual), status (pago / pendente / parcial + valor pago).
- Autocomplete de descrição com base em lançamentos anteriores (preenche a categoria sugerida).
- Lista do mês **agrupada por dia** (estilo extrato de banco), com o total do dia no cabeçalho de cada grupo, filtros em "chips" (tipo, categoria, status) e busca por texto.
- Pendentes com etiqueta visual ("vence em 3 dias", "vencida") e pagos em tom mais apagado.
- Editar, duplicar, excluir (vai para a **lixeira**, com opção "Desfazer" por alguns segundos).
- Botão "Copiar contas fixas do mês anterior".

### 4.4 Parcelas
- Cadastrar compra parcelada: descrição, valor da parcela, nº de parcelas, mês da 1ª parcela, categoria, meta opcional. Gera os lançamentos automaticamente.
- **Resumo no topo**: "Você paga R$ X/mês em parcelas" e "Em [mês] isso cai para R$ Y" (quando a próxima compra termina).
- **Gráfico "Compromisso com parcelas nos próximos 12 meses"**: barras empilhadas por mês (uma cor por compra), mostrando visualmente quando o peso das parcelas diminui. Tocar numa barra mostra quais compras compõem aquele mês.
- **Um card por compra**: descrição, valor da parcela, barra de progresso "4 de 12 pagas", quanto falta no total e "termina em mar/2027". Ordenar pelas que terminam primeiro; as concluídas vão para uma seção recolhida "Finalizadas".
- Visão em tabela (compras × meses) apenas como opção secundária ("Ver em tabela").
- Editar/cancelar compra: perguntar se altera só as parcelas futuras (não pagas).

### 4.5 Metas / caixinhas
- Criar meta (ex.: **Casamento**: aporte planejado de R$ 2.666,00/mês de ago/2026 a jan/2028; **Móveis**).
- Registrar aportes e retiradas por mês.
- **Card por meta**: saldo atual grande, anel ou barra de progresso até o valor-alvo e o prazo ("faltam 14 meses").
- **Previsão**: "No ritmo atual você atinge a meta em [mês/ano]" ou "Para chegar no prazo, aporte R$ X/mês". Destacar em âmbar quando estiver atrasada em relação ao planejado.
- **Gráfico planejado × realizado**: linha do saldo planejado acumulado vs. o saldo real ao longo dos meses.
- Histórico de aportes e retiradas como lista agrupada por mês (não tabela).

### 4.6 Investimentos
- Registrar o saldo por tipo em cada mês (Ações, Fundos, ETF, Exterior, Renda Fixa).
- Para exterior: valor em USD + cotação digitada → mostra o valor em R$.
- Botão "Copiar saldos do mês anterior" para só ajustar o que mudou.
- **Total investido** em destaque, com a variação em relação ao mês anterior (R$ e %).
- **Distribuição**: rosca ou barra segmentada por tipo (Ações, Fundos, ETF, Exterior, Renda Fixa).
- **Evolução**: gráfico de área/linha do total investido mês a mês.

### 4.7 Configurações
- Gerenciar categorias (criar, renomear, arquivar, cor).
- **Lixeira**: restaurar ou excluir de vez (com confirmação).
- **Histórico de alterações** (lido da tabela `historico`).
- **Exportar backup**: baixar tudo em `.xlsx` (uma aba por tabela) e em `.json`. Usar SheetJS (`xlsx`).
- **Importar backup `.json`** (restaurar).
- Trocar senha.

---

## 5. Garantias contra perda de dados (requisito principal)

1. Cada ação grava **direto no Supabase**. Mostrar toast "Salvo ✓" só **depois** da confirmação do servidor; em caso de erro, toast vermelho "Não foi salvo — tentar de novo" e o formulário **não** é limpo.
2. Indicador de conexão: se estiver offline, avisar claramente "Sem internet: alterações não serão salvas" e bloquear o envio (não fingir que salvou). Opcional, numa fase posterior: fila offline.
3. Nada é apagado de verdade sem passar pela lixeira (soft delete com `deleted_at`).
4. Toda alteração fica registrada em `historico`.
5. Exportação de backup sempre disponível em Configurações. Mostrar um lembrete discreto "Último backup: há X dias" (guardar a data no localStorage).
6. Formulários: avisar antes de sair da página com alterações não enviadas.

---

## 6. Fases de execução

Cada fase termina com: código funcionando, `npm run build` sem erros, `npm run lint` limpo e uma lista de **como testar**.

### Fase 1: Setup
- Criar projeto Vite + React + TS, Tailwind, ESLint/Prettier, estrutura de pastas, React Router, React Query.
- Cliente Supabase em `src/lib/supabase.ts`, `.env.example` e README com o passo a passo.
- **O que eu (Enzo) faço manualmente**: criar o projeto no supabase.com, copiar URL e anon key para `.env.local`. Me diga exatamente onde clicar.
- ✅ Critério: app sobe com `npm run dev` e mostra uma página em branco com layout base.

### Fase 2: Banco de dados
- Migrations da seção 3 (tabelas, RLS, policies, triggers, view, RPC, seed de categorias).
- Gerar tipos TypeScript do banco (`supabase gen types`) ou escrevê-los à mão em `src/types/db.ts`.
- ✅ Critério: rodar o SQL no Supabase sem erro; com 2 usuários de teste, um **não** consegue ver os dados do outro (testar e me mostrar como).

### Fase 3: Autenticação
- Telas de cadastro, login, reset de senha; rotas protegidas; logout; layout com menu (barra inferior no celular, lateral no desktop).
- ✅ Critério: criar conta, sair, entrar de novo, resetar senha.

### Fase 4: Lançamentos + Dashboard
- Seções 4.2 e 4.3 e as garantias da seção 5 (toasts de confirmação, lixeira, desfazer).
- ✅ Critério: lançar entrada e saída, marcar como pago, ver os cards do mês batendo com as contas, recarregar a página e os dados continuarem lá.

### Fase 5: Parcelas e Metas
- Seções 4.4 e 4.5, incluindo a grade de 12 meses.
- ✅ Critério: cadastrar uma compra em 12× de R$ 135,00 e ver as 12 parcelas no mês certo, o card com progresso e o gráfico empilhado dos próximos 12 meses; criar a meta Casamento, registrar aportes e ver a previsão de quando ela será atingida.

### Fase 6: Investimentos, Configurações e Configuração inicial
- Seções 4.6 e 4.7 (exportar/importar backup, lixeira, histórico, categorias).
- **Assistente de primeiro acesso** ("Configuração inicial"): um passo a passo simples para eu cadastrar o estado atual: saldo atual, parcelas em andamento (quantas já foram pagas e quantas faltam), saldo atual de cada meta e saldo de cada investimento. Para parcelas já em andamento, permitir informar "parcela atual = X de N" e gerar só as restantes.
- ✅ Critério: exportar `.xlsx` e abrir no Excel com todos os dados.

### Fase 7: PWA, acabamento e deploy
- vite-plugin-pwa (ícone, nome "Minhas Finanças", instalável no celular).
- Revisão de usabilidade no celular: botões grandes, teclado numérico no campo de valor (`inputMode="decimal"`), aceitar vírgula como separador decimal.
- Estados vazios amigáveis, loading skeletons, tema claro/escuro.
- Deploy na Vercel (variáveis de ambiente no painel) e configurar no Supabase as **Site URL / Redirect URLs** com o domínio da Vercel (necessário para o reset de senha).
- ✅ Critério: acessar pelo celular, instalar como app, fazer um lançamento e vê-lo no computador.

---

## 7. Regras para o Claude Code

- Não pule fases; pare ao final de cada uma.
- Antes de criar arquivos grandes, mostre a estrutura planejada.
- Não invente dados financeiros meus. Use dados fictícios apenas em testes, e apague-os depois.
- Nunca faça commit de `.env.local` nem de chaves.
- Se algo exigir ação minha no painel do Supabase ou da Vercel, me diga o passo a passo exato.
- Siga os princípios da seção 4.0 em todas as telas. Se estiver em dúvida entre uma tabela e outra forma de visualização, escolha a outra forma e deixe a tabela como opção secundária.
- Prefira soluções simples. É um app pessoal de um único usuário (eu), mas com multiusuário seguro via RLS.
- Commits pequenos e descritivos ao final de cada fase.
