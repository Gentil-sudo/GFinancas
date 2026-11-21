import { cn } from '@/lib/cn'

type Tom = 'primary' | 'success' | 'warning' | 'danger'

const cores: Record<Tom, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

/** Barra de progresso (0–100). O texto com o valor fica fora dela, ao lado. */
export function BarraProgresso({
  porcentagem,
  tom = 'primary',
  altura = 'normal',
  rotulo,
}: {
  porcentagem: number
  tom?: Tom
  altura?: 'fina' | 'normal'
  /** Texto para leitores de tela (ex.: "77% das contas pagas"). */
  rotulo: string
}) {
  const p = Math.max(0, Math.min(100, porcentagem))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
      aria-label={rotulo}
      className={cn('overflow-hidden rounded-full bg-track', altura === 'fina' ? 'h-2' : 'h-3')}
    >
      <div className={cn('h-full rounded-full', cores[tom])} style={{ width: `${p}%` }} />
    </div>
  )
}
