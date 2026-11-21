import { Link } from 'react-router'
import { BarraProgresso } from '@/components/ui/BarraProgresso'
import { Card, TituloCard } from '@/components/ui/Card'
import { resumirMeta, type MetaComMovimentos } from '@/features/metas/calculos'
import { textoPrevisao } from '@/features/metas/textos'
import { cn } from '@/lib/cn'
import { formatBRL, formatMesCurto } from '@/lib/format'

const corTom = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutro: 'text-muted',
} as const

/** "Quanto falta para a meta?": até 2 metas no Início, com progresso e previsão. */
export function CardMetas({ metas, mes }: { metas: MetaComMovimentos[]; mes: string }) {
  const ativas = metas.filter((m) => !m.arquivada)
  if (ativas.length === 0) return null
  const resumos = ativas.map((m) => resumirMeta(m, mes))
  const mostradas = resumos.slice(0, 2)

  return (
    <Card>
      {mostradas.map((r, i) => {
        const previsao = textoPrevisao(r)
        return (
          <div
            key={r.meta.id}
            className={cn('flex flex-col gap-3', i > 0 && 'border-t border-border pt-3.5')}
          >
            <TituloCard
              direita={
                r.porcentagem !== null && (
                  <span className="text-sm font-bold text-primary valor">
                    {Math.round(r.porcentagem)}%
                  </span>
                )
              }
            >
              Meta: {r.meta.nome}
            </TituloCard>
            {r.porcentagem !== null && (
              <BarraProgresso
                porcentagem={r.porcentagem}
                rotulo={`${r.meta.nome}: ${Math.round(r.porcentagem)}% da meta`}
              />
            )}
            <div className="flex justify-between gap-3 text-[13px] text-muted">
              <span className="valor">
                {formatBRL(r.saldo)}
                {r.alvo !== null && ` de ${formatBRL(r.alvo)}`}
              </span>
              {r.meta.fim && <span>Prazo {formatMesCurto(r.meta.fim)}</span>}
            </div>
            {previsao && (
              <span className={cn('text-[13px] font-semibold', corTom[previsao.tom])}>
                {previsao.texto}
              </span>
            )}
          </div>
        )
      })}
      <Link to="/metas" className="min-h-11 self-start pt-1 text-[13px] font-semibold text-primary">
        {resumos.length > 2 ? `Ver todas as metas (${resumos.length})` : 'Ver metas'}
      </Link>
    </Card>
  )
}
