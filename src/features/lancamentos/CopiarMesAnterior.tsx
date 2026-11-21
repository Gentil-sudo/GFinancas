import { useMemo, useState } from 'react'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { CarregandoLista } from '@/components/ui/Esqueleto'
import { Folha } from '@/components/ui/Folha'
import { useMapaCategorias } from '@/features/categorias/api'
import { formatBRL, formatDiaMes, mesmoDiaEm, nomeMes, somarMeses } from '@/lib/format'
import { useOnline } from '@/lib/online'
import { normalizarTexto, useAcoesLancamento, useLancamentosMes, type DadosLancamento } from './api'

/**
 * "Copiar contas fixas do mês anterior": lista os lançamentos do mês passado (menos parcelas,
 * que já são geradas sozinhas) para marcar quais repetir. Entram como pendentes.
 */
export function CopiarMesAnterior({
  aberta,
  onFechar,
  mes,
}: {
  aberta: boolean
  onFechar: () => void
  mes: string
}) {
  return (
    <Folha
      aberta={aberta}
      onFechar={onFechar}
      titulo={`Copiar de ${nomeMes(somarMeses(mes, -1))}`}
      subtitulo="Marque o que se repete neste mês. Tudo entra como pendente."
    >
      <Conteudo mes={mes} onFechar={onFechar} />
    </Folha>
  )
}

function Conteudo({ mes, onFechar }: { mes: string; onFechar: () => void }) {
  const anterior = somarMeses(mes, -1)
  const online = useOnline()
  const categorias = useMapaCategorias()
  const { criarVarios } = useAcoesLancamento()
  const { data: doAnterior, isLoading, isError } = useLancamentosMes(anterior)
  const { data: doAtual } = useLancamentosMes(mes)
  const [salvando, setSalvando] = useState(false)

  const candidatos = useMemo(() => {
    const existentes = new Set(
      (doAtual ?? []).map((l) => `${l.tipo}|${normalizarTexto(l.descricao)}`),
    )
    return (doAnterior ?? [])
      .filter((l) => !l.compra_parcelada_id)
      .map((l) => ({ l, jaExiste: existentes.has(`${l.tipo}|${normalizarTexto(l.descricao)}`) }))
      .sort((a, b) => a.l.data.localeCompare(b.l.data))
  }, [doAnterior, doAtual])

  // Marcados por padrão: tudo que ainda não existe neste mês.
  const [desmarcados, setDesmarcados] = useState<Set<string>>(new Set())
  const marcados = candidatos.filter((c) => !c.jaExiste && !desmarcados.has(c.l.id))

  function alternar(id: string) {
    setDesmarcados((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function copiar() {
    const lista: DadosLancamento[] = marcados.map(({ l }) => ({
      tipo: l.tipo,
      descricao: l.descricao,
      categoria_id: l.categoria_id,
      valor: l.valor,
      competencia: mes,
      data: mesmoDiaEm(l.data, mes),
      vencimento: l.vencimento ? mesmoDiaEm(l.vencimento, mes) : null,
      status: 'pendente',
      observacao: l.observacao,
    }))
    setSalvando(true)
    const ok = await criarVarios(lista)
    setSalvando(false)
    if (ok) onFechar()
  }

  if (isLoading) return <CarregandoLista linhas={3} />
  if (isError) return <Aviso tipo="erro">Não foi possível carregar o mês anterior.</Aviso>
  if (candidatos.length === 0) {
    return (
      <Aviso tipo="info">
        Nenhum lançamento em {nomeMes(anterior)} para copiar (parcelas não entram: elas já são
        geradas automaticamente).
      </Aviso>
    )
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border">
        {candidatos.map(({ l, jaExiste }) => {
          const marcado = !jaExiste && !desmarcados.has(l.id)
          return (
            <li key={l.id}>
              <label
                className={`flex min-h-14 items-center gap-3 px-4 py-2 ${jaExiste ? 'opacity-60' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  className="size-5 shrink-0 accent-[var(--primary)]"
                  checked={marcado}
                  disabled={jaExiste}
                  onChange={() => alternar(l.id)}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">{l.descricao}</span>
                  <span className="text-[13px] text-muted">
                    {jaExiste
                      ? 'Já existe neste mês'
                      : `${categorias.get(l.categoria_id ?? '')?.nome ?? 'Sem categoria'} · dia ${formatDiaMes(l.data).slice(0, 2)}`}
                  </span>
                </span>
                <span
                  className={`font-bold whitespace-nowrap valor ${l.tipo === 'entrada' ? 'text-success' : ''}`}
                >
                  {l.tipo === 'entrada' ? '+ ' : '− '}
                  {formatBRL(l.valor)}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      <Botao
        larguraTotal
        tamanho="grande"
        carregando={salvando}
        disabled={!online || marcados.length === 0}
        onClick={copiar}
      >
        {marcados.length === 0
          ? 'Nada marcado'
          : `Copiar ${marcados.length} ${marcados.length === 1 ? 'lançamento' : 'lançamentos'}`}
      </Botao>
    </>
  )
}
