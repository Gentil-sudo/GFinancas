import { ChevronDown, Layers, Plus } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina'
import { Card, TituloCard } from '@/components/ui/Card'
import { CarregandoLista, Esqueleto } from '@/components/ui/Esqueleto'
import { EstadoVazio } from '@/components/ui/EstadoVazio'
import { competencia, formatBRL, formatMesCurto, somar, somarMeses } from '@/lib/format'
import { AcoesCompra } from './AcoesCompra'
import { useComprasParceladas } from './api'
import {
  corDaSerie,
  ordenarEmAndamento,
  proximaQueda,
  valorNoMes,
  type ResumoCompra,
} from './calculos'
import { CardCompra } from './CardCompra'

// Recharts é pesado: só baixa quando a tela abre.
const GraficoParcelas = lazy(() =>
  import('./GraficoParcelas').then((m) => ({ default: m.GraficoParcelas })),
)

export function ParcelasPage() {
  const { resumos, isLoading, isError, refetch } = useComprasParceladas()
  const [selecionada, setSelecionada] = useState<ResumoCompra | null>(null)
  const [verTabela, setVerTabela] = useState(false)
  const atual = competencia()

  // Cores: na ordem de cadastro (a cor segue a compra, não a posição na lista).
  const ativas = useMemo(() => resumos.filter((r) => !r.finalizada), [resumos])
  const corPorId = useMemo(
    () => new Map(ativas.map((r, i) => [r.compra.id, corDaSerie(i)])),
    [ativas],
  )
  const emAndamento = useMemo(() => ordenarEmAndamento(resumos), [resumos])
  const finalizadas = resumos.filter((r) => r.finalizada)
  const meses = useMemo(() => Array.from({ length: 12 }, (_, i) => somarMeses(atual, i)), [atual])

  const porMes = valorNoMes(resumos, atual)
  const queda = proximaQueda(resumos, atual)

  return (
    <>
      <CabecalhoPagina titulo="Parcelas" />

      {isLoading ? (
        <CarregandoLista linhas={3} />
      ) : isError ? (
        <Aviso tipo="erro">
          Não foi possível carregar as parcelas.{' '}
          <button type="button" className="font-bold underline" onClick={() => refetch()}>
            Tentar de novo
          </button>
        </Aviso>
      ) : resumos.length === 0 ? (
        <EstadoVazio
          icone={Layers}
          titulo="Nenhuma parcela ainda"
          texto="Cadastre sua primeira compra parcelada: as parcelas entram sozinhas em cada mês."
          acao={<BotaoNovaCompra />}
        />
      ) : (
        <>
          {/* Resumo */}
          <Card>
            <span className="text-[13px] text-muted">Você paga por mês em parcelas</span>
            <span className="font-display text-[34px] leading-tight font-bold tracking-tight valor">
              {formatBRL(porMes)}
            </span>
            {queda ? (
              <span className="text-sm font-semibold text-success">
                {queda.valor > 0
                  ? `Em ${formatMesCurto(queda.mes)} cai para ${formatBRL(queda.valor)}`
                  : `Em ${formatMesCurto(queda.mes)} as parcelas acabam`}
              </span>
            ) : porMes === 0 && ativas.length > 0 ? (
              <span className="text-sm text-muted">Nenhuma parcela cai neste mês.</span>
            ) : null}
          </Card>

          {/* Próximos 12 meses */}
          {ativas.length > 0 && (
            <Card>
              <TituloCard>Próximos 12 meses</TituloCard>
              <Suspense fallback={<Esqueleto className="h-52" />}>
                <GraficoParcelas meses={meses} compras={ativas} />
              </Suspense>
            </Card>
          )}

          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold">Em andamento</h2>
            {emAndamento.length > 0 && (
              <button
                type="button"
                onClick={() => setVerTabela((v) => !v)}
                className="min-h-11 text-[13px] font-semibold text-primary hover:underline"
                aria-pressed={verTabela}
              >
                {verTabela ? 'Ver em cards' : 'Ver em tabela'}
              </button>
            )}
          </div>

          {emAndamento.length === 0 ? (
            <p className="text-sm text-muted">Todas as compras estão quitadas.</p>
          ) : verTabela ? (
            <TabelaParcelas compras={emAndamento} meses={meses} />
          ) : (
            emAndamento.map((r) => (
              <CardCompra
                key={r.compra.id}
                resumo={r}
                cor={corPorId.get(r.compra.id) ?? 'var(--muted)'}
                onClick={() => setSelecionada(r)}
              />
            ))
          )}

          <BotaoNovaCompra tracejado />

          {finalizadas.length > 0 && (
            <details className="group rounded-card border border-border bg-surface">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold">
                Finalizadas ({finalizadas.length})
                <ChevronDown
                  className="size-5 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <ul className="divide-y divide-border border-t border-border">
                {finalizadas.map((r) => (
                  <li key={r.compra.id}>
                    <button
                      type="button"
                      onClick={() => setSelecionada(r)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-bg"
                    >
                      <span className="font-semibold">{r.compra.descricao}</span>
                      <span className="text-muted valor">
                        {r.total}× {formatBRL(r.compra.valor_parcela)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      <AcoesCompra resumo={selecionada} onFechar={() => setSelecionada(null)} />
    </>
  )
}

function BotaoNovaCompra({ tracejado = false }: { tracejado?: boolean }) {
  return (
    <Link
      to="/parcelas/nova"
      className={
        tracejado
          ? 'flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-[15px] font-bold text-primary hover:bg-surface'
          : 'inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary'
      }
    >
      <Plus className="size-[18px]" aria-hidden />
      Nova compra parcelada
    </Link>
  )
}

/** Visão secundária: compras × meses (PLANO §4.4). */
function TabelaParcelas({ compras, meses }: { compras: ResumoCompra[]; meses: string[] }) {
  const valor = (r: ResumoCompra, m: string) =>
    somar(r.parcelas.filter((p) => p.competencia === m).map((p) => p.valor))

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full text-right text-[13px] whitespace-nowrap valor">
        <thead className="text-xs text-muted">
          <tr>
            <th className="sticky left-0 bg-surface px-3 py-2 text-left font-semibold">Compra</th>
            {meses.map((m) => (
              <th key={m} className="px-2 py-2 font-semibold capitalize">
                {formatMesCurto(m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {compras.map((r) => (
            <tr key={r.compra.id}>
              <td className="sticky left-0 bg-surface px-3 py-2 text-left font-semibold">
                {r.compra.descricao}
              </td>
              {meses.map((m) => {
                const v = valor(r, m)
                return (
                  <td key={m} className={v ? 'px-2 py-2' : 'px-2 py-2 text-muted'}>
                    {v ? formatBRL(v) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
          <tr className="font-bold">
            <td className="sticky left-0 bg-surface px-3 py-2 text-left">Total</td>
            {meses.map((m) => (
              <td key={m} className="px-2 py-2">
                {formatBRL(valorNoMes(compras, m))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
