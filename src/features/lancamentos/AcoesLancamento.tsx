import { Check, Copy, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Botao } from '@/components/ui/Botao'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { Folha } from '@/components/ui/Folha'
import { useMapaCategorias } from '@/features/categorias/api'
import { formatBRL, formatData, formatMes } from '@/lib/format'
import { useOnline } from '@/lib/online'
import type { Lancamento } from '@/types/db'
import { useAcoesLancamento } from './api'
import { etiquetaLancamento, faltaPagar, nomeStatus } from './status'

/** Folha com as ações de um lançamento: pagar, editar, duplicar, excluir. */
export function AcoesLancamento({
  lancamento: l,
  onFechar,
}: {
  lancamento: Lancamento | null
  onFechar: () => void
}) {
  const navigate = useNavigate()
  const online = useOnline()
  const categorias = useMapaCategorias()
  const { pagar, excluir } = useAcoesLancamento()
  const [ocupado, setOcupado] = useState<'pagar' | 'excluir' | null>(null)

  async function executar(tipo: 'pagar' | 'excluir') {
    if (!l) return
    setOcupado(tipo)
    const ok = tipo === 'pagar' ? await pagar(l) : await excluir(l)
    setOcupado(null)
    if (ok !== undefined) onFechar()
  }

  const etiqueta = l ? etiquetaLancamento(l) : null
  const entrada = l?.tipo === 'entrada'

  return (
    <Folha
      aberta={Boolean(l)}
      onFechar={onFechar}
      titulo={l?.descricao ?? ''}
      subtitulo={l ? categorias.get(l.categoria_id ?? '')?.nome : undefined}
    >
      {l && (
        <>
          <div className="flex flex-col gap-2 rounded-2xl bg-bg p-4">
            <span
              className={`font-display text-3xl font-bold valor ${entrada ? 'text-success' : 'text-text'}`}
            >
              {entrada ? '+ ' : '− '}
              {formatBRL(l.valor)}
            </span>
            {etiqueta ? (
              <Etiqueta tom={etiqueta.tom}>{etiqueta.texto}</Etiqueta>
            ) : (
              <Etiqueta tom="success">{nomeStatus(l.status, l.tipo)}</Etiqueta>
            )}
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted">Data</dt>
              <dd>{formatData(l.data)}</dd>
              <dt className="text-muted">Mês</dt>
              <dd>{formatMes(l.competencia)}</dd>
              {l.vencimento && (
                <>
                  <dt className="text-muted">Vencimento</dt>
                  <dd>{formatData(l.vencimento)}</dd>
                </>
              )}
              {l.status === 'parcial' && (
                <>
                  <dt className="text-muted">Falta</dt>
                  <dd>{formatBRL(faltaPagar(l))}</dd>
                </>
              )}
              {l.observacao && (
                <>
                  <dt className="text-muted">Obs.</dt>
                  <dd className="break-words">{l.observacao}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="flex flex-col gap-2">
            {l.status !== 'pago' && (
              <Botao
                larguraTotal
                carregando={ocupado === 'pagar'}
                disabled={!online || ocupado !== null}
                onClick={() => executar('pagar')}
              >
                <Check className="size-5" aria-hidden />
                {entrada ? 'Marcar como recebido' : 'Marcar como pago'}
                {l.status === 'parcial' && ` (falta ${formatBRL(faltaPagar(l))})`}
              </Botao>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Botao variante="secundario" onClick={() => navigate(`/lancamentos/${l.id}/editar`)}>
                <Pencil className="size-4" aria-hidden />
                Editar
              </Botao>
              <Botao
                variante="secundario"
                onClick={() => navigate(`/lancamentos/${l.id}/duplicar`)}
              >
                <Copy className="size-4" aria-hidden />
                Duplicar
              </Botao>
            </div>
            <Botao
              variante="fantasma"
              className="text-danger"
              carregando={ocupado === 'excluir'}
              disabled={!online || ocupado !== null}
              onClick={() => executar('excluir')}
            >
              <Trash2 className="size-4" aria-hidden />
              Excluir (vai para a lixeira)
            </Botao>
          </div>
        </>
      )}
    </Folha>
  )
}
