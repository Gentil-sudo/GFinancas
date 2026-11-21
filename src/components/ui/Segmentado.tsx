import { cn } from '@/lib/cn'

interface Opcao<T extends string> {
  valor: T
  rotulo: string
}

/** Controle segmentado (ex.: "− Saída | + Entrada"). */
export function Segmentado<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: Opcao<T>[]
  valor: T
  onChange: (v: T) => void
  rotulo: string
}) {
  return (
    <div
      role="group"
      aria-label={rotulo}
      className="grid gap-1 rounded-2xl bg-track p-1"
      style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(o.valor)}
            className={cn(
              'min-h-11 rounded-xl text-[15px] transition-colors',
              ativo ? 'bg-surface font-bold text-text shadow-sm' : 'font-semibold text-muted',
            )}
          >
            {o.rotulo}
          </button>
        )
      })}
    </div>
  )
}
