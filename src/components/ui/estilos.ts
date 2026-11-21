import { cn } from '@/lib/cn'

/** Classes do "caixote" de um campo, para <input>, <select>, <textarea>. */
export const classeCampo = cn(
  // text-base evita o zoom automático do iPhone ao focar o campo
  'min-h-13 w-full rounded-2xl border border-border bg-surface px-3.5 text-base text-text placeholder:text-muted/70',
  'focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none',
  'aria-invalid:border-danger aria-invalid:focus:ring-danger/25',
)

export const classeRotulo = 'text-[13px] font-semibold text-muted'
