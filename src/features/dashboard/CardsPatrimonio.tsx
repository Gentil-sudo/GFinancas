import { Layers, TrendingUp, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { formatBRL, formatMesCurto, somar } from '@/lib/format'
import type { Lancamento, ResumoMensal } from '@/types/db'

/** Dois cards pequenos: parcelas do mês e total investido (com o TOTAL do mês). */
export function CardsPatrimonio({
  resumo,
  lancamentos,
  queda,
}: {
  resumo: ResumoMensal
  lancamentos: Lancamento[]
  /** Quando o total de parcelas diminui (ver parcelas/calculos.proximaQueda). */
  queda: { mes: string; valor: number } | null
}) {
  const parcelas = lancamentos.filter((l) => l.compra_parcelada_id)
  const totalParcelas = somar(parcelas.map((l) => l.valor))

  return (
    <div className="grid grid-cols-2 gap-3">
      <MiniCard
        to="/parcelas"
        icone={Layers}
        titulo="Parcelas/mês"
        valor={formatBRL(totalParcelas)}
        detalhe={
          parcelas.length === 0
            ? 'Nenhuma parcela neste mês'
            : queda
              ? queda.valor > 0
                ? `Cai para ${formatBRL(queda.valor)} em ${formatMesCurto(queda.mes)}`
                : `Acabam em ${formatMesCurto(queda.mes)}`
              : `${parcelas.length} ${parcelas.length === 1 ? 'parcela' : 'parcelas'}`
        }
      />
      <MiniCard
        to="/investimentos"
        icone={TrendingUp}
        titulo="Investido"
        valor={formatBRL(resumo.total_investido)}
        detalhe={`TOTAL do mês ${formatBRL(resumo.total)}`}
      />
    </div>
  )
}

function MiniCard({
  to,
  icone: Icone,
  titulo,
  valor,
  detalhe,
}: {
  to: string
  icone: LucideIcon
  titulo: string
  valor: string
  detalhe: string
}) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 transition-colors hover:border-primary"
    >
      <span className="flex items-center gap-1.5 text-[13px] text-muted">
        <Icone className="size-4" aria-hidden /> {titulo}
      </span>
      <span className="font-display text-xl font-bold valor">{valor}</span>
      <span className="text-xs text-muted">{detalhe}</span>
    </Link>
  )
}
