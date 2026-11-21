import { CalendarCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { Card, TituloCard } from '@/components/ui/Card'
import { CarregandoLista } from '@/components/ui/Esqueleto'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { IconeCategoria } from '@/components/ui/IconeCategoria'
import { useMapaCategorias } from '@/features/categorias/api'
import { useAcoesLancamento, useProximosVencimentos } from '@/features/lancamentos/api'
import { faltaPagar, textoVencimento } from '@/features/lancamentos/status'
import { formatBRL } from '@/lib/format'
import { useOnline } from '@/lib/online'

/** Contas vencidas ou vencendo em até 7 dias, com "Pagar" em 1 toque. */
export function ProximosVencimentos() {
  const { data, isLoading, isError } = useProximosVencimentos()
  const categorias = useMapaCategorias()
  const { pagar } = useAcoesLancamento()
  const online = useOnline()
  const [pagando, setPagando] = useState<string | null>(null)

  return (
    <Card>
      <TituloCard
        direita={
          <Link to="/lancamentos?filtro=pendentes" className="font-semibold text-primary">
            Ver todos
          </Link>
        }
      >
        Próximos vencimentos
      </TituloCard>

      {isLoading ? (
        <CarregandoLista linhas={2} />
      ) : isError ? (
        <Aviso tipo="erro">Não foi possível carregar os vencimentos.</Aviso>
      ) : !data || data.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <CalendarCheck className="size-5 text-success" aria-hidden />
          Nenhuma conta vencendo nos próximos 7 dias.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((l) => {
            const venc = textoVencimento(l.vencimento!)
            return (
              <li key={l.id} className="flex items-center gap-3">
                <IconeCategoria icone={categorias.get(l.categoria_id ?? '')?.icone} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[15px] font-semibold">{l.descricao}</span>
                  <Etiqueta tom={venc.tom}>{venc.texto}</Etiqueta>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[15px] font-bold valor">{formatBRL(faltaPagar(l))}</span>
                  <Botao
                    variante="contorno"
                    className="min-h-11 rounded-full px-3.5 text-[13px] font-bold"
                    carregando={pagando === l.id}
                    disabled={!online || pagando !== null}
                    aria-label={`Pagar ${l.descricao}`}
                    onClick={async () => {
                      setPagando(l.id)
                      await pagar(l)
                      setPagando(null)
                    }}
                  >
                    Pagar
                  </Botao>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
