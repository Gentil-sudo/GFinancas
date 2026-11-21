import { useId } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { MensagemCampo } from './Campo'
import { classeRotulo } from './estilos'

/**
 * Campo de dinheiro em destaque ("R$ 152,40"): teclado numérico no celular, aceita vírgula.
 * `aoSair` recebe o texto digitado (para formatar, ex.: "152,4" → "152,40").
 */
export function CampoValorGrande({
  rotulo,
  erro,
  registro,
  aoSair,
  autoFocus,
}: {
  rotulo: string
  erro?: string
  registro: UseFormRegisterReturn
  aoSair?: (texto: string) => void
  autoFocus?: boolean
}) {
  const id = useId()
  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      <label htmlFor={id} className={classeRotulo}>
        {rotulo}
      </label>
      <div className="flex items-baseline justify-center gap-2">
        <span className="font-display text-2xl font-bold text-muted" aria-hidden>
          R$
        </span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          autoFocus={autoFocus}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : undefined}
          className="w-full max-w-[9ch] bg-transparent text-center font-display text-[40px] font-bold text-text valor outline-none placeholder:text-muted/50"
          {...registro}
          onBlur={(e) => {
            void registro.onBlur(e)
            aoSair?.(e.target.value)
          }}
        />
      </div>
      <MensagemCampo id={`${id}-erro`} erro={erro} />
    </div>
  )
}
