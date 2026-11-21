import { useQueryClient } from '@tanstack/react-query'
import { Archive, ArchiveRestore, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { Botao } from '@/components/ui/Botao'
import { CampoRotulado } from '@/components/ui/Campo'
import { CarregandoLista } from '@/components/ui/Esqueleto'
import { classeCampo, classeRotulo } from '@/components/ui/estilos'
import { Etiqueta } from '@/components/ui/Etiqueta'
import { Folha } from '@/components/ui/Folha'
import { IconeCategoria, IconeLucide } from '@/components/ui/IconeCategoria'
import { NOMES_ICONES } from '@/components/ui/icones'
import { Segmentado } from '@/components/ui/Segmentado'
import { useCategorias } from '@/features/categorias/api'
import { cn } from '@/lib/cn'
import { useOnline } from '@/lib/online'
import { supabase } from '@/lib/supabase'
import { useExecutarAcao } from '@/lib/useExecutarAcao'
import type { Categoria, TipoLancamento } from '@/types/db'
import { SubPagina } from './SubPagina'

export function CategoriasPage() {
  const { data, isLoading } = useCategorias()
  const [editando, setEditando] = useState<Categoria | 'nova' | null>(null)
  const grupos: Array<{ tipo: TipoLancamento; titulo: string }> = [
    { tipo: 'saida', titulo: 'Saídas' },
    { tipo: 'entrada', titulo: 'Entradas' },
  ]

  return (
    <SubPagina
      titulo="Categorias"
      acoes={
        <Botao onClick={() => setEditando('nova')} className="rounded-full">
          <Plus className="size-4" aria-hidden />
          Nova
        </Botao>
      }
    >
      {isLoading ? (
        <CarregandoLista linhas={4} />
      ) : (
        grupos.map((g) => (
          <section key={g.tipo} className="flex flex-col gap-1.5">
            <h2 className="px-1 font-sans text-[13px] font-semibold text-muted">{g.titulo}</h2>
            <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface px-4">
              {(data ?? [])
                .filter((c) => c.tipo === g.tipo)
                .sort(
                  (a, b) =>
                    Number(a.arquivada) - Number(b.arquivada) || a.nome.localeCompare(b.nome),
                )
                .map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setEditando(c)}
                      className={cn(
                        'flex w-full items-center gap-3 py-2.5 text-left',
                        c.arquivada && 'opacity-60',
                      )}
                    >
                      <IconeCategoria icone={c.icone} />
                      <span className="flex-1 font-semibold">{c.nome}</span>
                      {c.arquivada && <Etiqueta tom="neutro">Arquivada</Etiqueta>}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
      <Folha
        aberta={editando !== null}
        onFechar={() => setEditando(null)}
        titulo={editando === 'nova' ? 'Nova categoria' : 'Editar categoria'}
      >
        <FormCategoria
          key={editando === 'nova' ? 'nova' : (editando?.id ?? 'x')}
          original={editando === 'nova' ? null : editando}
          onFechar={() => setEditando(null)}
        />
      </Folha>
    </SubPagina>
  )
}

function FormCategoria({
  original,
  onFechar,
}: {
  original: Categoria | null
  onFechar: () => void
}) {
  const id = useId()
  const online = useOnline()
  const qc = useQueryClient()
  const executar = useExecutarAcao()
  const [nome, setNome] = useState(original?.nome ?? '')
  const [tipo, setTipo] = useState<TipoLancamento>(original?.tipo ?? 'saida')
  const [icone, setIcone] = useState(original?.icone ?? 'circle-ellipsis')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function salvar(mudancas?: Partial<Categoria>) {
    const nomeLimpo = nome.trim()
    if (!mudancas && !nomeLimpo) return setErro('Dê um nome à categoria.')
    setSalvando(true)
    const ok = await executar(
      async () => {
        const dados = mudancas ?? { nome: nomeLimpo, tipo, icone }
        const { error } = original
          ? await supabase.from('categorias').update(dados).eq('id', original.id)
          : await supabase.from('categorias').insert({ nome: nomeLimpo, tipo, icone })
        if (error) throw error
        return true
      },
      {
        sucesso: mudancas
          ? mudancas.arquivada
            ? `Arquivada: ${original?.nome}. Ela some das escolhas, mas os lançamentos antigos continuam.`
            : `Reativada: ${original?.nome}`
          : `Salvo ✓ ${nomeLimpo}`,
      },
    )
    setSalvando(false)
    if (ok) {
      await qc.invalidateQueries({ queryKey: ['categorias'] })
      onFechar()
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void salvar()
      }}
      className="flex flex-col gap-4"
    >
      {!original && (
        <Segmentado
          rotulo="Tipo"
          valor={tipo}
          onChange={setTipo}
          opcoes={[
            { valor: 'saida', rotulo: '− Saída' },
            { valor: 'entrada', rotulo: '+ Entrada' },
          ]}
        />
      )}
      <CampoRotulado rotulo="Nome" id={`${id}-nome`} erro={erro ?? undefined}>
        <input
          id={`${id}-nome`}
          value={nome}
          maxLength={40}
          onChange={(e) => {
            setNome(e.target.value)
            setErro(null)
          }}
          className={classeCampo}
        />
      </CampoRotulado>
      <fieldset>
        <legend className={cn(classeRotulo, 'mb-2')}>Ícone</legend>
        <div className="grid grid-cols-7 gap-1.5">
          {NOMES_ICONES.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={icone === n}
              aria-label={n}
              onClick={() => setIcone(n)}
              className={cn(
                'grid aspect-square min-h-11 place-items-center rounded-xl',
                icone === n
                  ? 'border-2 border-primary bg-primary-soft text-primary'
                  : 'border border-border text-text hover:bg-track',
              )}
            >
              <IconeLucide nome={n} className="size-5" />
            </button>
          ))}
        </div>
      </fieldset>
      <Botao type="submit" tamanho="grande" larguraTotal carregando={salvando} disabled={!online}>
        Salvar
      </Botao>
      {original && (
        <Botao
          variante="fantasma"
          disabled={!online || salvando}
          onClick={() => salvar({ arquivada: !original.arquivada })}
        >
          {original.arquivada ? (
            <>
              <ArchiveRestore className="size-4" aria-hidden /> Reativar categoria
            </>
          ) : (
            <>
              <Archive className="size-4" aria-hidden /> Arquivar categoria
            </>
          )}
        </Botao>
      )}
    </form>
  )
}
