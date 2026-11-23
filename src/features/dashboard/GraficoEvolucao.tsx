import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, TituloCard } from '@/components/ui/Card'
import { formatBRL, formatMes } from '@/lib/format'
import { useCoresTema } from '@/lib/useCoresTema'
import type { ResumoMensal } from '@/types/db'

interface Ponto {
  competencia: string
  rotulo: string
  entradas: number
  saidas: number
  resultado: number
}

const compacto = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/**
 * Evolução dos últimos meses: barras de entradas × saídas e a linha do resultado.
 * Um único eixo (tudo em R$). Cores validadas para daltonismo; a linha é a cor do texto.
 */
export function GraficoEvolucao({ meses, resumos }: { meses: string[]; resumos: ResumoMensal[] }) {
  const cores = useCoresTema()

  const dados = useMemo<Ponto[]>(() => {
    const porMes = new Map(resumos.map((r) => [r.competencia, r]))
    return meses.map((m) => {
      const r = porMes.get(m)
      return {
        competencia: m,
        rotulo: format(parseISO(m), 'MMM', { locale: ptBR }),
        entradas: Number(r?.total_entradas ?? 0),
        saidas: Number(r?.total_saidas ?? 0),
        resultado: Number(r?.resultado ?? 0),
      }
    })
  }, [meses, resumos])

  const temDados = dados.some((d) => d.entradas > 0 || d.saidas > 0)
  const temNegativo = dados.some((d) => d.resultado < 0)

  return (
    <Card>
      <TituloCard>Evolução</TituloCard>

      {!temDados ? (
        <p className="text-sm text-muted">
          Quando houver lançamentos em alguns meses, você vê aqui a comparação entre eles.
        </p>
      ) : (
        <>
          {/* Legenda: sempre presente (identidade nunca só pela cor) */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
            <ItemLegenda cor={cores.entrada} rotulo="Entradas" forma="barra" />
            <ItemLegenda cor={cores.saida} rotulo="Saídas" forma="barra" />
            <ItemLegenda cor={cores.texto} rotulo="Resultado" forma="linha" />
          </ul>

          <div
            className="h-56 w-full"
            role="img"
            aria-label={`Gráfico de entradas, saídas e resultado de ${formatMes(meses[0])} a ${formatMes(meses[meses.length - 1])}. Detalhes na tabela abaixo.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dados}
                barGap={2}
                barCategoryGap="28%"
                margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid vertical={false} stroke={cores.border} />
                <XAxis
                  dataKey="rotulo"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: cores.muted, fontSize: 12 }}
                />
                <YAxis
                  width={44}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: cores.muted, fontSize: 11 }}
                  tickFormatter={(v: number) => compacto.format(v)}
                />
                {temNegativo && <ReferenceLine y={0} stroke={cores.muted} />}
                <Tooltip
                  cursor={{ fill: cores.border, opacity: 0.5 }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as Ponto | undefined
                    if (!active || !p) return null
                    return (
                      <div className="rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-text shadow-lg">
                        <p className="mb-1 font-bold">{formatMes(p.competencia)}</p>
                        <LinhaDica cor={cores.entrada} rotulo="Entradas" valor={p.entradas} />
                        <LinhaDica cor={cores.saida} rotulo="Saídas" valor={p.saidas} />
                        <LinhaDica cor={cores.texto} rotulo="Resultado" valor={p.resultado} />
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="entradas"
                  name="Entradas"
                  fill={cores.entrada}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Bar
                  dataKey="saidas"
                  name="Saídas"
                  fill={cores.saida}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Line
                  dataKey="resultado"
                  name="Resultado"
                  type="monotone"
                  stroke={cores.texto}
                  strokeWidth={2}
                  dot={{ r: 4, fill: cores.texto, stroke: cores.surface, strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: cores.texto, stroke: cores.surface, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Visão em tabela: opção secundária e alternativa acessível */}
          <details className="text-sm">
            <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary">
              Ver em tabela
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1.5 text-left font-semibold">Mês</th>
                    <th className="py-1.5 font-semibold">Entradas</th>
                    <th className="py-1.5 font-semibold">Saídas</th>
                    <th className="py-1.5 font-semibold">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border valor">
                  {dados.map((d) => (
                    <tr key={d.competencia}>
                      <td className="py-1.5 text-left capitalize">{d.rotulo}</td>
                      <td className="py-1.5">{formatBRL(d.entradas)}</td>
                      <td className="py-1.5">{formatBRL(d.saidas)}</td>
                      <td className="py-1.5 font-semibold">{formatBRL(d.resultado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </Card>
  )
}

function ItemLegenda({
  cor,
  rotulo,
  forma,
}: {
  cor: string
  rotulo: string
  forma: 'barra' | 'linha'
}) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={forma === 'barra' ? 'size-2.5 rounded-[3px]' : 'h-0.5 w-3.5 rounded-full'}
        style={{ background: cor }}
      />
      {rotulo}
    </li>
  )
}

function LinhaDica({ cor, rotulo, valor }: { cor: string; rotulo: string; valor: number }) {
  return (
    <p className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted">
        <span aria-hidden className="size-2 rounded-full" style={{ background: cor }} />
        {rotulo}
      </span>
      <span className="font-semibold valor">{formatBRL(valor)}</span>
    </p>
  )
}
