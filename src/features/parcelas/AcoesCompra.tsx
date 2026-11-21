import { Ban, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { Folha } from '@/components/ui/Folha'
import { nomeStatus } from '@/features/lancamentos/status'
import { formatBRL, formatMesCurto } from '@/lib/format'
import { useOnline } from '@/lib/online'
import { useAcoesCompra } from './api'
import type { ResumoCompra } from './calculos'

/** Detalhes de uma compra: lista de parcelas, editar e cancelar. */
export function AcoesCompra({
  resumo: r,
  onFechar,
}: {
  resumo: ResumoCompra | null
  onFechar: () => void
}) {
  return (
    <Folha
      aberta={Boolean(r)}
      onFechar={onFechar}
      titulo={r?.compra.descricao ?? ''}
      subtitulo={
        r && (
          <span className="valor">
            {r.total}× {formatBRL(r.compra.valor_parcela)} ·{' '}
            {formatMesCurto(r.compra.primeira_competencia)} a {formatMesCurto(r.ultimaCompetencia)}
          </span>
        )
      }
    >
      {r && <Conteudo resumo={r} onFechar={onFechar} />}
    </Folha>
  )
}

function Conteudo({ resumo: r, onFechar }: { resumo: ResumoCompra; onFechar: () => void }) {
  const navigate = useNavigate()
  const online = useOnline()
  const { cancelar } = useAcoesCompra()
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const naoPagas = r.parcelas.filter((p) => p.status === 'pendente').length

  async function confirmarCancelamento() {
    setCancelando(true)
    const ok = await cancelar(r.compra.id, r.compra.descricao)
    setCancelando(false)
    if (ok !== undefined) onFechar()
  }

  return (
    <>
      <ul className="flex max-h-72 flex-col divide-y divide-border overflow-y-auto rounded-2xl border border-border">
        {r.pagasAntes > 0 && (
          <li className="px-4 py-2.5 text-sm text-muted">
            Parcelas 1 a {r.pagasAntes}: pagas antes do cadastro
          </li>
        )}
        {r.parcelas.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-12 font-semibold">
              {p.numero_parcela}/{r.total}
            </span>
            <span className="flex-1 text-muted capitalize">{formatMesCurto(p.competencia)}</span>
            <Etiqueta tom={p.status === 'pago' ? 'success' : 'warning'}>
              {nomeStatus(p.status, 'saida')}
            </Etiqueta>
            <span className="w-24 text-right font-semibold valor">{formatBRL(p.valor)}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">
        Cada parcela também aparece em Lançamentos, no mês dela, para pagar como qualquer conta.
      </p>

      {confirmando ? (
        <div className="flex flex-col gap-3">
          <Aviso tipo="atencao">
            {naoPagas > 0
              ? `As ${naoPagas} parcelas não pagas vão para a lixeira. As pagas continuam no histórico.`
              : 'A compra vai para a lixeira. As parcelas pagas continuam no histórico.'}
          </Aviso>
          <div className="grid grid-cols-2 gap-2">
            <Botao variante="secundario" onClick={() => setConfirmando(false)}>
              Voltar
            </Botao>
            <Botao
              variante="perigo"
              carregando={cancelando}
              disabled={!online}
              onClick={confirmarCancelamento}
            >
              Cancelar compra
            </Botao>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Botao variante="secundario" onClick={() => navigate(`/parcelas/${r.compra.id}/editar`)}>
            <Pencil className="size-4" aria-hidden />
            Editar
          </Botao>
          <Botao variante="secundario" className="text-danger" onClick={() => setConfirmando(true)}>
            <Ban className="size-4" aria-hidden />
            Cancelar compra
          </Botao>
        </div>
      )}
    </>
  )
}
