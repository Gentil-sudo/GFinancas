import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props extends ComponentProps<'input'> {
  label: string
  erro?: string
  dica?: string
  /** Elemento à direita, dentro do campo (ex.: botão de mostrar senha). */
  direita?: ReactNode
}

/**
 * Campo de formulário com label, mensagem de erro e dica acessíveis.
 * Funciona direto com `{...register('campo')}` do react-hook-form (o `ref` passa junto).
 */
export function Campo({ label, erro, dica, direita, id, className, ...props }: Props) {
  const autoId = useId()
  const campoId = id ?? autoId
  const descId = erro ? `${campoId}-erro` : dica ? `${campoId}-dica` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={campoId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={campoId}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descId}
          className={cn(
            // text-base evita o zoom automático do iPhone ao focar o campo
            'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400',
            'focus:border-marca focus:ring-2 focus:ring-marca/20 focus:outline-none',
            'aria-invalid:border-saida aria-invalid:focus:ring-saida/20',
            direita && 'pr-12',
            className,
          )}
          {...props}
        />
        {direita && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">{direita}</div>
        )}
      </div>
      {erro ? (
        <p id={descId} className="text-sm text-saida">
          {erro}
        </p>
      ) : (
        dica && (
          <p id={descId} className="text-sm text-slate-500">
            {dica}
          </p>
        )
      )}
    </div>
  )
}

/** Campo de senha com botão de mostrar/ocultar. */
export function CampoSenha(props: Omit<Props, 'type' | 'direita'>) {
  const [visivel, setVisivel] = useState(false)
  const Icone = visivel ? EyeOff : Eye

  return (
    <Campo
      {...props}
      type={visivel ? 'text' : 'password'}
      direita={
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visivel}
          className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Icone className="size-5" aria-hidden />
        </button>
      }
    />
  )
}
