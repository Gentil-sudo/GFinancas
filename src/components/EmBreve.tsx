import type { LucideIcon } from 'lucide-react'

interface Props {
  titulo: string
  icone: LucideIcon
  fase: number
  descricao: string
}

/** Placeholder das telas que ainda serão construídas nas próximas fases. */
export function EmBreve({ titulo, icone: Icone, fase, descricao }: Props) {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">{titulo}</h1>
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <span className="mb-3 grid size-12 place-items-center rounded-full bg-marca-suave text-marca">
          <Icone className="size-6" aria-hidden />
        </span>
        <p className="font-medium text-slate-900">Em construção (Fase {fase})</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{descricao}</p>
      </div>
    </section>
  )
}
