import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatBRL, formatMes, somar } from '@/lib/format'
import { useCoresTema } from '@/lib/useCoresTema'
import { MAX_SERIES, type ResumoCompra } from './calculos'

interface Serie {
  chave: string
  nome: string
  cor: string
}

const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

/**
 * "Compromisso com parcelas nos próximos 12 meses": barras empilhadas, uma cor por compra
 * (paleta categórica validada, ordem fixa). Da 7ª compra em diante, "Outras".
 * Tocar/passar o mouse numa barra mostra quais compras compõem o mês.
 */
export function GraficoParcelas({
  meses,
  compras,
}: {
  meses: string[]
  /** Compras em andamento, já na ordem das cores. */
  compras: ResumoCompra[]
}) {
  const cores = useCoresTema()

  const series = useMemo<Serie[]>(() => {
    const s: Serie[] = compras.slice(0, MAX_SERIES).map((r, i) => ({
      chave: r.compra.id,
      nome: r.compra.descricao,
      cor: cores.series[i],
    }))
    if (compras.length > MAX_SERIES) s.push({ chave: 'outras', nome: 'Outras', cor: cores.muted })
    return s
  }, [compras, cores])

  const dados = useMemo(
    () =>
      meses.map((m) => {
        const linha: Record<string, number | string> = {
          competencia: m,
          rotulo: format(parseISO(m), 'MMM', { locale: ptBR }),
        }
        compras.forEach((r, i) => {
          const v = somar(r.parcelas.filter((p) => p.competencia === m).map((p) => p.valor))
          const chave = i < MAX_SERIES ? r.compra.id : 'outras'
          linha[chave] = Number(linha[chave] ?? 0) + v
        })
        return linha
      }),
    [meses, compras],
  )

  return (
    <>
      <div
        className="h-52 w-full"
        role="img"
        aria-label={`Parcelas por mês de ${formatMes(meses[0])} a ${formatMes(meses[meses.length - 1])}. Detalhes em "Ver em tabela".`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            barCategoryGap="18%"
            margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke={cores.border} />
            <XAxis
              dataKey="rotulo"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fill: cores.muted, fontSize: 11 }}
            />
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              tick={{ fill: cores.muted, fontSize: 11 }}
              tickFormatter={(v: number) => compacto.format(v)}
            />
            <Tooltip
              cursor={{ fill: cores.border, opacity: 0.5 }}
              content={({ active, payload }) => {
                const linha = payload?.[0]?.payload as Record<string, number | string> | undefined
                if (!active || !linha) return null
                const itens = series.filter((s) => Number(linha[s.chave] ?? 0) > 0)
                const total = somar(itens.map((s) => Number(linha[s.chave])))
                return (
                  <div className="rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text shadow-lg">
                    <p className="mb-1 font-bold">{formatMes(String(linha.competencia))}</p>
                    {itens.length === 0 && <p className="text-muted">Nenhuma parcela</p>}
                    {itens.map((s) => (
                      <p key={s.chave} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-muted">
                          <span
                            aria-hidden
                            className="size-2 rounded-full"
                            style={{ background: s.cor }}
                          />
                          {s.nome}
                        </span>
                        <span className="font-semibold valor">
                          {formatBRL(Number(linha[s.chave]))}
                        </span>
                      </p>
                    ))}
                    {itens.length > 1 && (
                      <p className="mt-1 flex justify-between gap-4 border-t border-border pt-1 font-bold">
                        <span>Total</span>
                        <span className="valor">{formatBRL(total)}</span>
                      </p>
                    )}
                  </div>
                )
              }}
            />
            {series.map((s, i) => (
              <Bar
                key={s.chave}
                dataKey={s.chave}
                name={s.nome}
                stackId="parcelas"
                fill={s.cor}
                // 2px de "respiro" entre segmentos empilhados (cor da superfície)
                stroke={cores.surface}
                strokeWidth={2}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda: sempre presente (identidade nunca só pela cor) */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        {series.map((s) => (
          <li key={s.chave} className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: s.cor }} />
            {s.nome}
          </li>
        ))}
      </ul>
    </>
  )
}
