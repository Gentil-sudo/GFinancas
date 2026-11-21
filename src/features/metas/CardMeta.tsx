import { ChevronDown, Pencil, Target, Trash2 } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AnelProgresso } from '@/components/ui/AnelProgresso'
import { BarraProgresso } from '@/components/ui/BarraProgresso'
import { Botao } from '@/components/ui/Botao'
import { Esqueleto } from '@/components/ui/Esqueleto'
import { cn } from '@/lib/cn'
import { competencia, formatBRL, formatMes } from '@/lib/format'
import { useOnline } from '@/lib/online'
import type { MetaMovimento, TipoMovimentoMeta } from '@/types/db'
import type { ResumoCompra } from '@/features/parcelas/calculos'
import { useAcoesMeta } from './api'
import { serieMeta, type MetaComMovimentos, type ResumoMeta } from './calculos'
import { textoPrazo, textoPrevisao } from './textos'

const GraficoMeta = lazy(() => import('./GraficoMeta').then((m) => ({ default: m.GraficoMeta })))

const corTom = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutro: 'text-muted',
} as const

export function CardMeta({
  resumo: r,
  meta,
  expandida,
  onAlternar,
  onMovimento,
  comprasLigadas,
}: {
  resumo: ResumoMeta
  meta: MetaComMovimentos
  expandida: boolean
  onAlternar: () => void
  onMovimento: (tipo: TipoMovimentoMeta) => void
  comprasLigadas: ResumoCompra[]
}) {
  const previsao = textoPrevisao(r)
  const idConteudo = `meta-${meta.id}`

  return (
    <section className="flex flex-col gap-3.5 rounded-card border border-border bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={expandida}
          aria-controls={idConteudo}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Target className="size-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[17px] font-bold">{meta.nome}</span>
            <span className="text-[13px] text-muted">
              {expandida || r.alvo === null
                ? textoPrazo(r)
                : `${formatBRL(r.saldo)} de ${formatBRL(r.alvo)}`}
            </span>
          </span>
          {!expandida && r.porcentagem !== null && (
            <span className="text-sm font-bold text-primary valor">
              {Math.round(r.porcentagem)}%
            </span>
          )}
          <ChevronDown
            className={cn(
              'size-5 shrink-0 text-muted transition-transform',
              expandida && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
        <Link
          to={`/metas/${meta.id}/editar`}
          aria-label={`Editar meta ${meta.nome}`}
          className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-track hover:text-text"
        >
          <Pencil className="size-4" aria-hidden />
        </Link>
      </div>

      {!expandida ? (
        <>
          {r.porcentagem !== null && (
            <BarraProgresso
              porcentagem={r.porcentagem}
              rotulo={`${meta.nome}: ${Math.round(r.porcentagem)}% da meta`}
            />
          )}
          {r.alvo === null && (
            <span className="font-display text-2xl font-bold valor">{formatBRL(r.saldo)}</span>
          )}
          {previsao && (
            <span className={cn('text-[13px] font-semibold', corTom[previsao.tom])}>
              {previsao.texto}
            </span>
          )}
        </>
      ) : (
        <div id={idConteudo} className="flex flex-col gap-3.5">
          <div className="flex items-center gap-[18px]">
            {r.porcentagem !== null && (
              <AnelProgresso
                porcentagem={r.porcentagem}
                rotulo={`${Math.round(r.porcentagem)}% da meta`}
              />
            )}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-muted">Guardado</span>
              <span className="font-display text-[26px] leading-tight font-bold valor">
                {formatBRL(r.saldo)}
              </span>
              {r.alvo !== null && (
                <span className="text-[13px] text-muted valor">de {formatBRL(r.alvo)}</span>
              )}
            </div>
          </div>

          {(meta.aporte_mensal_planejado || previsao) && (
            <div
              className={cn(
                'flex flex-col gap-1 rounded-xl px-3.5 py-3',
                r.atrasada ? 'bg-warning-soft' : 'bg-primary-soft',
              )}
            >
              {meta.aporte_mensal_planejado && (
                <span className="text-sm font-bold text-text valor">
                  Planejado: {formatBRL(meta.aporte_mensal_planejado)}/mês
                </span>
              )}
              {previsao && (
                <span
                  className={cn(
                    'text-[13px]',
                    previsao.tom === 'warning' ? 'font-semibold text-warning' : 'text-muted',
                  )}
                >
                  {previsao.texto}
                </span>
              )}
            </div>
          )}

          {meta.meta_movimentos.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">
                {meta.aporte_mensal_planejado ? 'Planejado × realizado' : 'Evolução'}
              </span>
              <Suspense fallback={<Esqueleto className="h-36" />}>
                <GraficoMeta
                  pontos={serieMeta(meta, competencia())}
                  temPlano={Boolean(meta.aporte_mensal_planejado)}
                />
              </Suspense>
            </div>
          )}

          {comprasLigadas.length > 0 && (
            <div className="rounded-xl border border-border px-3.5 py-2.5 text-[13px]">
              <span className="font-semibold">Parcelas ligadas: </span>
              {comprasLigadas
                .map((c) => `${c.compra.descricao} (${c.pagas}/${c.total})`)
                .join(', ')}
            </div>
          )}

          <Historico movimentos={meta.meta_movimentos} />

          <div className="grid grid-cols-2 gap-2.5">
            <Botao onClick={() => onMovimento('aporte')} className="min-h-12">
              + Aporte
            </Botao>
            <Botao
              variante="secundario"
              onClick={() => onMovimento('retirada')}
              className="min-h-12"
            >
              − Retirada
            </Botao>
          </div>
        </div>
      )}
    </section>
  )
}

/** Aportes e retiradas agrupados por mês (lista, não tabela). */
function Historico({ movimentos }: { movimentos: MetaMovimento[] }) {
  const [tudo, setTudo] = useState(false)
  const online = useOnline()
  const { excluirMovimento } = useAcoesMeta()

  const grupos = useMemo(() => {
    const porMes = new Map<string, MetaMovimento[]>()
    for (const m of [...movimentos].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
      const g = porMes.get(m.competencia)
      if (g) g.push(m)
      else porMes.set(m.competencia, [m])
    }
    return [...porMes.entries()].sort(([a], [b]) => b.localeCompare(a))
  }, [movimentos])

  if (grupos.length === 0) {
    return <p className="text-sm text-muted">Nenhum aporte ainda. Registre o primeiro abaixo.</p>
  }
  const visiveis = tudo ? grupos : grupos.slice(0, 3)

  return (
    <div className="flex flex-col gap-3">
      {visiveis.map(([mes, itens]) => (
        <div key={mes} className="flex flex-col">
          <span className="pb-1 text-sm font-bold capitalize">{formatMes(mes)}</span>
          {itens.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 py-1 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {m.descricao || (m.tipo === 'aporte' ? 'Aporte' : 'Retirada')}
              </span>
              <span
                className={cn(
                  'font-bold whitespace-nowrap valor',
                  m.tipo === 'aporte' ? 'text-success' : 'text-danger',
                )}
              >
                {m.tipo === 'aporte' ? '+ ' : '− '}
                {formatBRL(m.valor)}
              </span>
              <button
                type="button"
                disabled={!online}
                onClick={() => excluirMovimento(m)}
                aria-label={`Excluir ${m.tipo} de ${formatBRL(m.valor)}`}
                className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-track hover:text-danger disabled:opacity-50"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ))}
      {grupos.length > 3 && (
        <button
          type="button"
          onClick={() => setTudo((t) => !t)}
          className="min-h-11 self-start text-sm font-semibold text-primary hover:underline"
        >
          {tudo ? 'Mostrar menos' : `Ver todo o histórico (${grupos.length} meses)`}
        </button>
      )}
    </div>
  )
}
