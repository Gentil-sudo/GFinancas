import { ArrowDown, ArrowUp, CopyPlus, Plus, TrendingUp } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina'
import { Card, TituloCard } from '@/components/ui/Card'
import { CarregandoLista, Esqueleto } from '@/components/ui/Esqueleto'
import { EstadoVazio } from '@/components/ui/EstadoVazio'
import { SeletorMes } from '@/components/ui/SeletorMes'
import { cn } from '@/lib/cn'
import { formatBRL, nomeMes, round2, somar, somarMeses } from '@/lib/format'
import { useMes } from '@/lib/mesContext'
import { useOnline } from '@/lib/online'
import { useDeslizar } from '@/lib/useDeslizar'
import type { Investimento } from '@/types/db'
import {
  corTipo,
  nomeTipo,
  TIPOS_INVESTIMENTO,
  totalDoMes,
  useAcoesInvestimento,
  useInvestimentos,
} from './api'
import { FormInvestimento } from './FormInvestimento'

const GraficoInvestido = lazy(() =>
  import('./GraficoInvestido').then((m) => ({ default: m.GraficoInvestido })),
)

export function InvestimentosPage() {
  const { mes, mudarMes } = useMes()
  const deslizar = useDeslizar(
    () => mudarMes(1),
    () => mudarMes(-1),
  )
  const online = useOnline()
  const inicio = somarMeses(mes, -11)
  const anterior = somarMeses(mes, -1)
  const { data, isLoading, isError, refetch } = useInvestimentos(inicio, mes)
  const { copiar } = useAcoesInvestimento()
  const [form, setForm] = useState<{ original: Investimento | null } | null>(null)
  const [copiando, setCopiando] = useState(false)

  const lista = useMemo(() => data ?? [], [data])
  const doMes = lista.filter((i) => i.competencia === mes)
  const doAnterior = lista.filter((i) => i.competencia === anterior)
  const total = totalDoMes(lista, mes)
  const totalAnterior = totalDoMes(lista, anterior)
  const variacao = doAnterior.length > 0 ? round2(total - totalAnterior) : null
  const variacaoPct =
    variacao !== null && totalAnterior > 0 ? (variacao / totalAnterior) * 100 : null

  const porTipo = TIPOS_INVESTIMENTO.map((t) => ({
    ...t,
    total: somar(doMes.filter((i) => i.tipo === t.valor).map((i) => i.valor_brl)),
    itens: doMes.filter((i) => i.tipo === t.valor),
  })).filter((t) => t.itens.length > 0)

  const evolucao = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const c = somarMeses(inicio, i)
        return { competencia: c, total: totalDoMes(lista, c) }
      }),
    [inicio, lista],
  )
  const mesesComDados = evolucao.filter((p) => p.total > 0).length

  async function copiarAnterior() {
    setCopiando(true)
    await copiar(doAnterior, mes)
    setCopiando(false)
  }

  const botaoCopiar = doAnterior.length > 0 && doMes.length === 0 && (
    <Botao variante="secundario" carregando={copiando} disabled={!online} onClick={copiarAnterior}>
      <CopyPlus className="size-4" aria-hidden />
      Copiar saldos de {nomeMes(anterior)}
    </Botao>
  )

  return (
    <>
      <div className="flex flex-col gap-[18px]" {...deslizar}>
        <CabecalhoPagina titulo="Investimentos" />
        <SeletorMes />

        {isLoading ? (
          <CarregandoLista linhas={3} />
        ) : isError ? (
          <Aviso tipo="erro">
            Não foi possível carregar os investimentos.{' '}
            <button type="button" className="font-bold underline" onClick={() => refetch()}>
              Tentar de novo
            </button>
          </Aviso>
        ) : doMes.length === 0 ? (
          <EstadoVazio
            icone={TrendingUp}
            titulo={`Nenhum saldo em ${nomeMes(mes)}`}
            texto="Registre quanto você tem em cada tipo de investimento. No mês seguinte, é só copiar e ajustar o que mudou."
            acao={
              <>
                <Botao onClick={() => setForm({ original: null })}>
                  <Plus className="size-4" aria-hidden />
                  Adicionar saldo
                </Botao>
                {botaoCopiar}
              </>
            }
          />
        ) : (
          <>
            {/* Total investido + variação */}
            <Card>
              <span className="text-[13px] text-muted">Total investido</span>
              <span className="font-display text-[34px] leading-tight font-bold tracking-tight valor">
                {formatBRL(total)}
              </span>
              {variacao !== null && (
                <span
                  className={cn(
                    'flex items-center gap-1 text-sm font-semibold',
                    variacao > 0 ? 'text-success' : variacao < 0 ? 'text-danger' : 'text-muted',
                  )}
                >
                  {variacao > 0 ? (
                    <ArrowUp className="size-4" aria-hidden />
                  ) : variacao < 0 ? (
                    <ArrowDown className="size-4" aria-hidden />
                  ) : null}
                  {variacao === 0
                    ? `Igual a ${nomeMes(anterior)}`
                    : `${formatBRL(Math.abs(variacao))}${
                        variacaoPct !== null
                          ? ` (${variacao > 0 ? '+' : '−'}${Math.abs(variacaoPct).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)`
                          : ''
                      } ${variacao > 0 ? 'a mais' : 'a menos'} que ${nomeMes(anterior)}`}
                </span>
              )}
            </Card>

            {/* Distribuição: barra segmentada por tipo */}
            <Card>
              <TituloCard>Distribuição</TituloCard>
              <div
                className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full"
                role="img"
                aria-label={porTipo
                  .map((t) => `${t.nome} ${Math.round((t.total / (total || 1)) * 100)}%`)
                  .join(', ')}
              >
                {porTipo
                  .filter((t) => t.total > 0)
                  .map((t) => (
                    <span
                      key={t.valor}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${(t.total / (total || 1)) * 100}%`,
                        background: corTipo(t.valor),
                      }}
                    />
                  ))}
              </div>
              <ul className="flex flex-col gap-2">
                {porTipo.map((t) => (
                  <li key={t.valor} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2.5 rounded-[3px]"
                        style={{ background: corTipo(t.valor) }}
                      />
                      {t.nome}
                    </span>
                    <span className="text-muted valor">
                      {formatBRL(t.total)} · {total > 0 ? Math.round((t.total / total) * 100) : 0}%
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Saldos do mês */}
            <div className="flex items-baseline justify-between">
              <h2 className="text-[17px] font-bold">Saldos de {nomeMes(mes)}</h2>
              <button
                type="button"
                onClick={() => setForm({ original: null })}
                className="flex min-h-11 items-center gap-1 text-[13px] font-semibold text-primary"
              >
                <Plus className="size-4" aria-hidden /> Adicionar
              </button>
            </div>
            <div className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface px-4 py-1.5">
              {porTipo.flatMap((t) =>
                t.itens.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setForm({ original: i })}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span
                      aria-hidden
                      className="size-3 shrink-0 rounded"
                      style={{ background: corTipo(i.tipo) }}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px] font-semibold">
                        {i.descricao || nomeTipo(i.tipo)}
                      </span>
                      <span className="text-[13px] text-muted">
                        {nomeTipo(i.tipo)}
                        {i.moeda === 'USD' &&
                          ` · US$ ${Number(i.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} × ${Number(i.cotacao).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`}
                      </span>
                    </span>
                    <span className="text-[15px] font-bold whitespace-nowrap valor">
                      {formatBRL(i.valor_brl)}
                    </span>
                  </button>
                )),
              )}
            </div>
          </>
        )}

        {/* Evolução */}
        {!isLoading && mesesComDados >= 2 && (
          <Card>
            <TituloCard>Evolução (12 meses)</TituloCard>
            <Suspense fallback={<Esqueleto className="h-44" />}>
              <GraficoInvestido pontos={evolucao} />
            </Suspense>
          </Card>
        )}
      </div>

      <FormInvestimento
        aberta={form !== null}
        original={form?.original ?? null}
        mes={mes}
        onFechar={() => setForm(null)}
      />
    </>
  )
}
