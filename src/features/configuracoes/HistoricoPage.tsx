import { History } from 'lucide-react'
import { useMemo } from 'react'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { CarregandoLista } from '@/components/ui/Esqueleto'
import { EstadoVazio } from '@/components/ui/EstadoVazio'
import { formatDiaCabecalho } from '@/lib/format'
import { descreverHistorico, useHistorico } from './historico'
import { SubPagina } from './SubPagina'

export function HistoricoPage() {
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useHistorico()

  const grupos = useMemo(() => {
    const linhas = (data?.pages.flat() ?? []).map(descreverHistorico)
    const porDia = new Map<string, typeof linhas>()
    for (const l of linhas) {
      const dia = new Date(l.quando).toLocaleDateString('sv-SE') // yyyy-mm-dd no fuso local
      const g = porDia.get(dia)
      if (g) g.push(l)
      else porDia.set(dia, [l])
    }
    return [...porDia.entries()]
  }, [data])

  return (
    <SubPagina titulo="Histórico">
      <p className="text-sm text-muted">
        Toda alteração fica registrada aqui, automaticamente, pelo banco de dados.
      </p>
      {isLoading ? (
        <CarregandoLista linhas={4} />
      ) : isError ? (
        <Aviso tipo="erro">
          Não foi possível carregar o histórico.{' '}
          <button type="button" className="font-bold underline" onClick={() => refetch()}>
            Tentar de novo
          </button>
        </Aviso>
      ) : grupos.length === 0 ? (
        <EstadoVazio icone={History} titulo="Nada registrado ainda" />
      ) : (
        <>
          {grupos.map(([dia, linhas]) => (
            <section key={dia} className="flex flex-col">
              <h2 className="px-1 pb-1.5 font-sans text-[13px] font-semibold text-muted">
                {formatDiaCabecalho(dia)}
              </h2>
              <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface px-4">
                {linhas.map((l) => (
                  <li key={l.id} className="py-3 text-sm">
                    <p>
                      <span className="font-semibold">{l.titulo}</span> {l.acao}
                      <span className="text-muted">
                        {' '}
                        ·{' '}
                        {new Date(l.quando).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                    {l.mudancas.length > 0 && (
                      <ul className="mt-1 text-[13px] text-muted valor">
                        {l.mudancas.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {hasNextPage && (
            <Botao
              variante="secundario"
              carregando={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              Carregar mais
            </Botao>
          )}
        </>
      )}
    </SubPagina>
  )
}
