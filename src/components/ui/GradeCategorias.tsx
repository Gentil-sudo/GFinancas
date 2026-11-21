import { cn } from '@/lib/cn'
import type { Categoria } from '@/types/db'
import { MensagemCampo } from './Campo'
import { classeRotulo } from './estilos'
import { IconeLucide } from './IconeCategoria'

/** Escolha de categoria em grade de botões grandes (ícone + nome). */
export function GradeCategorias({
  categorias,
  valor,
  onChange,
  erro,
  rotulo = 'Categoria',
}: {
  categorias: Categoria[]
  valor: string
  onChange: (id: string) => void
  erro?: string
  rotulo?: string
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={cn(classeRotulo, 'mb-2')}>{rotulo}</legend>
      <div className="grid grid-cols-3 gap-2">
        {categorias.map((c) => {
          const ativo = valor === c.id
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={ativo}
              onClick={() => onChange(c.id)}
              className={cn(
                'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-xs font-semibold',
                ativo
                  ? 'border-2 border-primary bg-primary-soft text-primary'
                  : 'border border-border bg-surface text-text hover:bg-track',
              )}
            >
              <IconeLucide nome={c.icone} className="size-5" />
              <span className="line-clamp-2 text-center">{c.nome}</span>
            </button>
          )
        })}
      </div>
      <MensagemCampo erro={erro} />
    </fieldset>
  )
}
