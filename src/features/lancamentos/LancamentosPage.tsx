import { Check, CopyPlus, ListX, Plus, ReceiptText, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina'
import { Chip } from '@/components/ui/Chip'
import { CarregandoLista } from '@/components/ui/Esqueleto'
import { EstadoVazio } from '@/components/ui/EstadoVazio'
import { LinhaDeslizavel } from '@/components/ui/LinhaDeslizavel'
import { SeletorMes } from '@/components/ui/SeletorMes'
import { useMapaCategorias } from '@/features/categorias/api'
import { cn } from '@/lib/cn'
import { formatBRL, formatDiaCabecalho, nomeMes, somar, somarMeses } from '@/lib/format'
import { useMes } from '@/lib/mesContext'
import { useOnline } from '@/lib/online'
import { useDeslizar } from '@/lib/useDeslizar'
import type { Lancamento } from '@/types/db'
import { AcoesLancamento } from './AcoesLancamento'
import { normalizarTexto, useAcoesLancamento, useLancamentosMes } from './api'
import { CopiarMesAnterior } from './CopiarMesAnterior'
import { ItemLancamento } from './ItemLancamento'

const FILTROS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'entradas', rotulo: 'Entradas' },
  { valor: 'saidas', rotulo: 'Saídas' },
  { valor: 'pendentes', rotulo: 'Pendentes' },
] as const
type Filtro = (typeof FILTROS)[number]['valor']

export function LancamentosPage() {
  const { mes, mudarMes } = useMes()
  const deslizar = useDeslizar(
    () => mudarMes(1),
    () => mudarMes(-1),
  )
  const [params, setParams] = useSearchParams()
  const filtro = (params.get('filtro') as Filtro | null) ?? 'todos'
  const categoriaFiltro = params.get('categoria') ?? ''
  const [busca, setBusca] = useState('')
  const [selecionado, setSelecionado] = useState<Lancamento | null>(null)
  const [copiarAberto, setCopiarAberto] = useState(false)

  const { data, isLoading, isError, refetch } = useLancamentosMes(mes)
  const categorias = useMapaCategorias()
  const { pagar, excluir } = useAcoesLancamento()
  const online = useOnline()

  function mudarParam(chave: string, valor: string, padrao: string) {
    setParams(
      (p) => {
        if (valor === padrao) p.delete(chave)
        else p.set(chave, valor)
        return p
      },
      { replace: true },
    )
  }

  const lista = useMemo(() => data ?? [], [data])
  const totalEntradas = somar(lista.filter((l) => l.tipo === 'entrada').map((l) => l.valor))
  const totalSaidas = somar(lista.filter((l) => l.tipo === 'saida').map((l) => l.valor))

  const categoriasDoMes = useMemo(() => {
    const ids = new Set(lista.map((l) => l.categoria_id).filter(Boolean) as string[])
    return [...ids]
      .map((id) => categorias.get(id))
      .filter((c) => c !== undefined)
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }, [lista, categorias])

  const filtrados = useMemo(() => {
    const termo = normalizarTexto(busca)
    return lista.filter((l) => {
      if (filtro === 'entradas' && l.tipo !== 'entrada') return false
      if (filtro === 'saidas' && l.tipo !== 'saida') return false
      if (filtro === 'pendentes' && l.status === 'pago') return false
      if (categoriaFiltro && l.categoria_id !== categoriaFiltro) return false
      if (termo && !normalizarTexto(l.descricao).includes(termo)) return false
      return true
    })
  }, [lista, filtro, categoriaFiltro, busca])

  const grupos = useMemo(() => {
    const porDia = new Map<string, Lancamento[]>()
    for (const l of filtrados) {
      const g = porDia.get(l.data)
      if (g) g.push(l)
      else porDia.set(l.data, [l])
    }
    return [...porDia.entries()].sort(([a], [b]) => b.localeCompare(a))
  }, [filtrados])

  const temFiltro = filtro !== 'todos' || categoriaFiltro !== '' || busca !== ''
  const mesAnterior = nomeMes(somarMeses(mes, -1))

  return (
    <>
      <div className="flex flex-col gap-[18px]" {...deslizar}>
        <CabecalhoPagina titulo="Lançamentos" />
        <SeletorMes />

        <label className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-border bg-surface px-3.5 text-muted focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
          <Search className="size-5 shrink-0" aria-hidden />
          <span className="sr-only">Buscar lançamento</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descrição"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-muted"
          />
        </label>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar">
          {FILTROS.map((f) => (
            <Chip
              key={f.valor}
              ativo={filtro === f.valor}
              onClick={() => mudarParam('filtro', f.valor, 'todos')}
            >
              {f.rotulo}
            </Chip>
          ))}
          {categoriasDoMes.length > 0 && (
            <label className="relative">
              <span className="sr-only">Filtrar por categoria</span>
              <select
                value={categoriaFiltro}
                onChange={(e) => mudarParam('categoria', e.target.value, '')}
                className={cn(
                  'min-h-10 appearance-none rounded-full border px-4 pr-8 text-sm font-semibold',
                  categoriaFiltro
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-surface text-text',
                )}
              >
                <option value="">Categoria</option>
                {categoriasDoMes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs"
              >
                ▾
              </span>
            </label>
          )}
        </div>

        {isLoading ? (
          <CarregandoLista linhas={4} />
        ) : isError ? (
          <Aviso tipo="erro">
            Não foi possível carregar os lançamentos.{' '}
            <button type="button" className="font-bold underline" onClick={() => refetch()}>
              Tentar de novo
            </button>
          </Aviso>
        ) : lista.length === 0 ? (
          <EstadoVazio
            icone={ReceiptText}
            titulo={`Nenhum lançamento em ${nomeMes(mes)}`}
            texto="Registre o que entrou ou saiu, ou traga as contas que se repetem do mês passado."
            acao={
              <>
                <Link
                  to="/lancamentos/novo"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary"
                >
                  <Plus className="size-4" aria-hidden />
                  Novo lançamento
                </Link>
                <Botao variante="secundario" onClick={() => setCopiarAberto(true)}>
                  <CopyPlus className="size-4" aria-hidden />
                  Copiar de {mesAnterior}
                </Botao>
              </>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 rounded-card border border-border bg-surface p-3.5">
                <span className="text-[13px] text-muted">Entradas</span>
                <span className="text-lg font-bold text-success valor">
                  + {formatBRL(totalEntradas)}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-card border border-border bg-surface p-3.5">
                <span className="text-[13px] text-muted">Saídas</span>
                <span className="text-lg font-bold valor">− {formatBRL(totalSaidas)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCopiarAberto(true)}
              className="-mt-1.5 flex min-h-11 items-center gap-2 self-start rounded-xl px-1 text-sm font-semibold text-primary hover:underline"
            >
              <CopyPlus className="size-4" aria-hidden />
              Copiar contas fixas de {mesAnterior}
            </button>

            {grupos.length === 0 ? (
              <EstadoVazio
                compacto
                icone={ListX}
                titulo="Nada encontrado com esses filtros"
                acao={
                  temFiltro && (
                    <Botao
                      variante="secundario"
                      onClick={() => {
                        setBusca('')
                        setParams({}, { replace: true })
                      }}
                    >
                      Limpar filtros
                    </Botao>
                  )
                }
              />
            ) : (
              grupos.map(([dia, itens]) => {
                const saldo = somar(
                  itens.map((l) => (l.tipo === 'entrada' ? Number(l.valor) : -Number(l.valor))),
                )
                return (
                  <section key={dia} className="flex flex-col" aria-label={formatDiaCabecalho(dia)}>
                    <div className="flex justify-between px-1 pb-1.5 text-[13px] font-semibold text-muted">
                      <span>{formatDiaCabecalho(dia)}</span>
                      <span className="valor">
                        {saldo >= 0 ? '+ ' : '− '}
                        {formatBRL(Math.abs(saldo))}
                      </span>
                    </div>
                    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
                      {itens.map((l) => (
                        <LinhaDeslizavel
                          key={l.id}
                          aoDeslizarDireita={
                            l.status !== 'pago' && online
                              ? {
                                  rotulo: l.tipo === 'entrada' ? 'Receber' : 'Pagar',
                                  icone: Check,
                                  tom: 'success',
                                  executar: () => void pagar(l),
                                }
                              : undefined
                          }
                          aoDeslizarEsquerda={
                            online
                              ? {
                                  rotulo: 'Excluir',
                                  icone: Trash2,
                                  tom: 'danger',
                                  executar: () => void excluir(l),
                                }
                              : undefined
                          }
                        >
                          <div className="px-4 py-0.5">
                            <ItemLancamento
                              lancamento={l}
                              categoria={categorias.get(l.categoria_id ?? '')}
                              onClick={() => setSelecionado(l)}
                            />
                          </div>
                        </LinhaDeslizavel>
                      ))}
                    </div>
                  </section>
                )
              })
            )}
          </>
        )}
      </div>
      {/* Fora da área de deslizar, para gestos dentro das folhas não trocarem o mês. */}
      <AcoesLancamento lancamento={selecionado} onFechar={() => setSelecionado(null)} />
      <CopiarMesAnterior aberta={copiarAberto} onFechar={() => setCopiarAberto(false)} mes={mes} />
    </>
  )
}
