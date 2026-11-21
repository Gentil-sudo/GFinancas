import { PieChart } from 'lucide-react'
import { useMemo } from 'react'
import { BarraProgresso } from '@/components/ui/BarraProgresso'
import { Card, TituloCard } from '@/components/ui/Card'
import { useMapaCategorias } from '@/features/categorias/api'
import { formatBRL, somar } from '@/lib/format'
import type { Lancamento } from '@/types/db'

const MAX_BARRAS = 6

/**
 * "Para onde foi o dinheiro": barras horizontais por categoria, da maior para a menor,
 * com % do total. Mais de 6 categorias → as menores viram "Outros".
 */
export function ParaOndeFoi({ lancamentos }: { lancamentos: Lancamento[] }) {
  const categorias = useMapaCategorias()

  const linhas = useMemo(() => {
    const porCategoria = new Map<string, number[]>()
    for (const l of lancamentos) {
      if (l.tipo !== 'saida') continue
      const chave = l.categoria_id ?? ''
      const lista = porCategoria.get(chave)
      if (lista) lista.push(Number(l.valor))
      else porCategoria.set(chave, [Number(l.valor)])
    }
    const todas = [...porCategoria.entries()]
      .map(([id, valores]) => ({
        id,
        nome: categorias.get(id)?.nome ?? 'Sem categoria',
        valor: somar(valores),
      }))
      .sort((a, b) => b.valor - a.valor)

    if (todas.length <= MAX_BARRAS) return todas
    const principais = todas.slice(0, MAX_BARRAS - 1)
    const resto = todas.slice(MAX_BARRAS - 1)
    return [
      ...principais,
      {
        id: 'outros',
        nome: `Outros (${resto.length})`,
        valor: somar(resto.map((r) => r.valor)),
      },
    ]
  }, [lancamentos, categorias])

  const total = somar(linhas.map((l) => l.valor))
  const maior = Math.max(...linhas.map((l) => l.valor), 0)

  return (
    <Card>
      <TituloCard>Para onde foi o dinheiro</TituloCard>
      {linhas.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <PieChart className="size-5" aria-hidden />
          As saídas do mês aparecem aqui, separadas por categoria.
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {linhas.map((l) => {
            const pct = total > 0 ? Math.round((l.valor / total) * 100) : 0
            return (
              <li key={l.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-text">{l.nome}</span>
                  <span className="shrink-0 text-muted valor">
                    {formatBRL(l.valor)} · {pct}%
                  </span>
                </div>
                <BarraProgresso
                  altura="fina"
                  porcentagem={maior > 0 ? (l.valor / maior) * 100 : 0}
                  rotulo={`${l.nome}: ${pct}% das saídas`}
                />
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
