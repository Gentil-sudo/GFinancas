import { PiggyBank, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina'
import { CarregandoLista } from '@/components/ui/Esqueleto'
import { EstadoVazio } from '@/components/ui/EstadoVazio'
import { useComprasParceladas } from '@/features/parcelas/api'
import { competencia } from '@/lib/format'
import type { Meta, TipoMovimentoMeta } from '@/types/db'
import { useMetas } from './api'
import { resumirMeta } from './calculos'
import { CardMeta } from './CardMeta'
import { FormMovimento } from './FormMovimento'

function BotaoNovaMeta() {
  return (
    <Link
      to="/metas/nova"
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-on-primary hover:opacity-90"
    >
      <Plus className="size-4" aria-hidden />
      Nova meta
    </Link>
  )
}

export function MetasPage() {
  const { data, isLoading, isError, refetch } = useMetas()
  const { resumos: compras } = useComprasParceladas()
  const [abertas, setAbertas] = useState<Set<string> | null>(null)
  const [movimento, setMovimento] = useState<{ meta: Meta; tipo: TipoMovimentoMeta } | null>(null)

  const metas = useMemo(() => (data ?? []).filter((m) => !m.arquivada), [data])
  const atual = competencia()
  // Por padrão, a primeira meta aparece aberta.
  const expandidas = abertas ?? new Set(metas.slice(0, 1).map((m) => m.id))

  function alternar(id: string) {
    const n = new Set(expandidas)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    setAbertas(n)
  }

  return (
    <>
      <CabecalhoPagina titulo="Metas" acoes={metas.length > 0 && <BotaoNovaMeta />} />

      {isLoading ? (
        <CarregandoLista linhas={2} />
      ) : isError ? (
        <Aviso tipo="erro">
          Não foi possível carregar as metas.{' '}
          <button type="button" className="font-bold underline" onClick={() => refetch()}>
            Tentar de novo
          </button>
        </Aviso>
      ) : metas.length === 0 ? (
        <EstadoVazio
          icone={PiggyBank}
          titulo="Nenhuma meta ainda"
          texto="Crie uma caixinha (Casamento, Viagem, Reserva...) e acompanhe quanto falta e quando você chega lá."
          acao={<BotaoNovaMeta />}
        />
      ) : (
        metas.map((m) => (
          <CardMeta
            key={m.id}
            meta={m}
            resumo={resumirMeta(m, atual)}
            expandida={expandidas.has(m.id)}
            onAlternar={() => alternar(m.id)}
            onMovimento={(tipo) => setMovimento({ meta: m, tipo })}
            comprasLigadas={compras.filter((c) => c.compra.meta_id === m.id && !c.finalizada)}
          />
        ))
      )}

      <FormMovimento
        meta={movimento?.meta ?? null}
        tipoInicial={movimento?.tipo ?? 'aporte'}
        onFechar={() => setMovimento(null)}
      />
    </>
  )
}
