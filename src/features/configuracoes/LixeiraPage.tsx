import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { CarregandoLista } from '@/components/ui/Esqueleto'
import { EstadoVazio } from '@/components/ui/EstadoVazio'
import { formatBRL, formatData } from '@/lib/format'
import { useOnline } from '@/lib/online'
import { NOME_TIPO_LIXEIRA, useAcoesLixeira, useLixeira, type ItemLixeira } from './lixeira'
import { SubPagina } from './SubPagina'

export function LixeiraPage() {
  const { data, isLoading, isError, refetch } = useLixeira()
  const { restaurar, excluirDeVez } = useAcoesLixeira()
  const online = useOnline()
  const [ocupado, setOcupado] = useState<string | null>(null)
  const itens = data ?? []

  async function executar(chave: string, acao: () => Promise<unknown>) {
    setOcupado(chave)
    await acao()
    setOcupado(null)
  }

  function confirmarExclusao(lista: ItemLixeira[]) {
    const texto =
      lista.length === 1
        ? `Excluir "${lista[0].titulo}" de vez? Não dá para desfazer.`
        : `Esvaziar a lixeira (${lista.length} itens)? Não dá para desfazer.`
    if (window.confirm(texto))
      void executar(lista.length === 1 ? `x-${lista[0].id}` : 'tudo', () => excluirDeVez(lista))
  }

  return (
    <SubPagina
      titulo="Lixeira"
      acoes={
        itens.length > 0 && (
          <Botao
            variante="fantasma"
            className="text-danger"
            carregando={ocupado === 'tudo'}
            disabled={!online || ocupado !== null}
            onClick={() => confirmarExclusao(itens)}
          >
            Esvaziar
          </Botao>
        )
      }
    >
      <p className="text-sm text-muted">
        O que você exclui vem para cá. Restaure quando quiser; "excluir de vez" apaga para sempre (o
        registro continua no Histórico).
      </p>
      {isLoading ? (
        <CarregandoLista linhas={3} />
      ) : isError ? (
        <Aviso tipo="erro">
          Não foi possível carregar a lixeira.{' '}
          <button type="button" className="font-bold underline" onClick={() => refetch()}>
            Tentar de novo
          </button>
        </Aviso>
      ) : itens.length === 0 ? (
        <EstadoVazio icone={Trash2} titulo="A lixeira está vazia" texto="Nada foi excluído." />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
          {itens.map((item) => (
            <li key={`${item.tipo}-${item.id}`} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.titulo}</p>
                  <p className="text-[13px] text-muted">
                    {NOME_TIPO_LIXEIRA[item.tipo]} · {item.detalhe} · excluído em{' '}
                    {formatData(item.excluidoEm)}
                  </p>
                </div>
                {item.valor !== null && (
                  <span className="shrink-0 font-bold valor">{formatBRL(item.valor)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Botao
                  variante="secundario"
                  className="min-h-10 text-[13px]"
                  carregando={ocupado === `r-${item.id}`}
                  disabled={!online || ocupado !== null}
                  onClick={() => executar(`r-${item.id}`, () => restaurar(item))}
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Restaurar
                </Botao>
                <Botao
                  variante="fantasma"
                  className="min-h-10 text-[13px] text-danger"
                  carregando={ocupado === `x-${item.id}`}
                  disabled={!online || ocupado !== null}
                  onClick={() => confirmarExclusao([item])}
                >
                  Excluir de vez
                </Botao>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SubPagina>
  )
}
