import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatBRL, formatMes } from '@/lib/format'
import { useCoresTema } from '@/lib/useCoresTema'
import type { PontoMeta } from './calculos'

const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

/**
 * Planejado × realizado: linha tracejada (planejado, cinza) × linha cheia (realizado, primária).
 * A diferença não depende só da cor: traço vs. tracejado, e legenda com os nomes.
 */
export function GraficoMeta({ pontos, temPlano }: { pontos: PontoMeta[]; temPlano: boolean }) {
  const cores = useCoresTema()
  const dados = pontos.map((p) => ({
    ...p,
    rotulo: format(parseISO(p.competencia), 'MMM/yy', { locale: ptBR }),
  }))

  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-36 w-full"
        role="img"
        aria-label={`Saldo guardado mês a mês${temPlano ? ', comparado com o planejado' : ''}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={cores.border} />
            <XAxis
              dataKey="rotulo"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
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
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as PontoMeta | undefined
                if (!active || !p) return null
                return (
                  <div className="rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text shadow-lg">
                    <p className="mb-1 font-bold">{formatMes(p.competencia)}</p>
                    {p.realizado !== null && (
                      <p className="flex justify-between gap-4">
                        <span className="text-muted">Guardado</span>
                        <span className="font-semibold valor">{formatBRL(p.realizado)}</span>
                      </p>
                    )}
                    {p.planejado !== null && (
                      <p className="flex justify-between gap-4">
                        <span className="text-muted">Planejado</span>
                        <span className="font-semibold valor">{formatBRL(p.planejado)}</span>
                      </p>
                    )}
                  </div>
                )
              }}
            />
            {temPlano && (
              <Line
                dataKey="planejado"
                name="Planejado"
                type="linear"
                stroke={cores.muted}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, fill: cores.muted, stroke: cores.surface, strokeWidth: 2 }}
              />
            )}
            <Line
              dataKey="realizado"
              name="Realizado"
              type="linear"
              stroke={cores.primary}
              strokeWidth={3}
              strokeLinecap="round"
              connectNulls={false}
              dot={false}
              activeDot={{ r: 5, fill: cores.primary, stroke: cores.surface, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex gap-4 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="h-[3px] w-4 rounded-full bg-primary" />
          Realizado
        </li>
        {temPlano && (
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="w-4 border-t-2 border-dashed border-muted" />
            Planejado
          </li>
        )}
      </ul>
    </div>
  )
}
