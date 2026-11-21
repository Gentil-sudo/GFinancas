import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatBRL, formatMes } from '@/lib/format'
import { useCoresTema } from '@/lib/useCoresTema'

const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

/** Evolução do total investido mês a mês (uma série só: o título já a nomeia). */
export function GraficoInvestido({
  pontos,
}: {
  pontos: Array<{ competencia: string; total: number }>
}) {
  const cores = useCoresTema()
  const dados = pontos.map((p) => ({
    ...p,
    rotulo: format(parseISO(p.competencia), 'MMM', { locale: ptBR }),
  }))

  return (
    <div className="h-44 w-full" role="img" aria-label="Total investido nos últimos 12 meses">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="preenchimento-investido" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cores.primary} stopOpacity={0.25} />
              <stop offset="100%" stopColor={cores.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={cores.border} />
          <XAxis
            dataKey="rotulo"
            tickLine={false}
            axisLine={false}
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
              const p = payload?.[0]?.payload as { competencia: string; total: number } | undefined
              if (!active || !p) return null
              return (
                <div className="rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text shadow-lg">
                  <p className="font-bold">{formatMes(p.competencia)}</p>
                  <p className="valor">{formatBRL(p.total)}</p>
                </div>
              )
            }}
          />
          <Area
            dataKey="total"
            type="monotone"
            stroke={cores.primary}
            strokeWidth={2}
            fill="url(#preenchimento-investido)"
            dot={{ r: 4, fill: cores.primary, stroke: cores.surface, strokeWidth: 2 }}
            activeDot={{ r: 5, fill: cores.primary, stroke: cores.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
