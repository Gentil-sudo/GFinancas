import { Eye, EyeOff } from 'lucide-react'
import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { classeCampo, classeRotulo } from './estilos'

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
      <label htmlFor={campoId} className={classeRotulo}>
        {label}
      </label>
      <div className="relative">
        <input
          id={campoId}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descId}
          className={cn(classeCampo, direita && 'pr-12', className)}
          {...props}
        />
        {direita && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">{direita}</div>
        )}
      </div>
      <MensagemCampo id={descId} erro={erro} dica={dica} />
    </div>
  )
}

export function MensagemCampo({ id, erro, dica }: { id?: string; erro?: string; dica?: string }) {
  if (erro) {
    return (
      <p id={id} className="text-sm font-medium text-danger">
        {erro}
      </p>
    )
  }
  if (dica) {
    return (
      <p id={id} className="text-sm text-muted">
        {dica}
      </p>
    )
  }
  return null
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
          className="grid size-11 place-items-center rounded-xl text-muted hover:bg-track hover:text-text"
        >
          <Icone className="size-5" aria-hidden />
        </button>
      }
    />
  )
}
