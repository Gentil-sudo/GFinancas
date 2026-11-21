import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { BarraProgresso } from '@/components/ui/BarraProgresso'
import { TituloCard } from '@/components/ui/Card'
import { formatBRL } from '@/lib/format'
import type { ResumoMensal } from '@/types/db'

/** "Contas do mês": uma barra pago × falta pagar. Tocar abre os pendentes. */
export function CardContas({ resumo }: { resumo: ResumoMensal }) {
  const total = Number(resumo.total_saidas)
  const pago = Number(resumo.total_pago)
  const falta = Number(resumo.total_pendente)
  const pct = total > 0 ? (pago / total) * 100 : 0

  const conteudo = (
    <>
      <TituloCard direita={total > 0 ? `${Math.round(pct)}% pago` : undefined}>
        Contas do mês
      </TituloCard>
      {total === 0 ? (
        <p className="text-sm text-muted">Nenhuma conta lançada neste mês ainda.</p>
      ) : (
        <>
          <BarraProgresso
            porcentagem={pct}
            tom="success"
            rotulo={`${Math.round(pct)}% das contas do mês pagas`}
          />
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="font-bold text-success valor">{formatBRL(pago)} pagos</span>
            {falta > 0 ? (
              <span className="flex items-center gap-0.5 font-bold text-warning valor">
                faltam {formatBRL(falta)}
                <ChevronRight className="size-4" aria-hidden />
              </span>
            ) : (
              <span className="font-bold text-success">Tudo pago ✓</span>
            )}
          </div>
        </>
      )}
    </>
  )

  const classe = 'flex flex-col gap-3.5 rounded-card border border-border bg-surface p-5'
  if (falta <= 0) return <section className={classe}>{conteudo}</section>
  return (
    <Link
      to="/lancamentos?filtro=pendentes"
      aria-label={`Contas do mês: ${formatBRL(pago)} pagos, faltam ${formatBRL(falta)}. Ver pendentes`}
      className={`${classe} transition-colors hover:border-primary`}
    >
      {conteudo}
    </Link>
  )
}
