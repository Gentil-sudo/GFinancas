import { Check, ChevronRight, LogOut, TrendingUp } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Botao } from '@/components/ui/Botao'
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina'
import { Campo } from '@/components/ui/Campo'
import { Card, TituloCard } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/authContext'
import { usePerfil, useSalvarPerfil } from '@/features/perfil/api'
import { cn } from '@/lib/cn'
import { useOnline } from '@/lib/online'
import { OPCOES_TEMA, type TemaEscolha } from '@/lib/tema'
import { useTema } from '@/lib/temaContext'

export function ConfiguracoesPage() {
  return (
    <>
      <CabecalhoPagina titulo="Configurações" />
      <SecaoConta />
      <SecaoAparencia />

      <Link
        to="/investimentos"
        className="flex min-h-14 items-center gap-3 rounded-card border border-border bg-surface px-5 font-semibold hover:border-primary md:hidden"
      >
        <TrendingUp className="size-5 text-primary" aria-hidden />
        <span className="flex-1">Investimentos</span>
        <ChevronRight className="size-5 text-muted" aria-hidden />
      </Link>

      <p className="rounded-card border border-dashed border-border bg-surface px-4 py-6 text-center text-sm text-muted">
        Categorias, lixeira, histórico de alterações, backup e troca de senha chegam na Fase 6.
      </p>
    </>
  )
}

function SecaoConta() {
  const { user, sair } = useAuth()
  const { data: perfil, isLoading } = usePerfil()
  const { tema } = useTema()
  const salvar = useSalvarPerfil()
  const online = useOnline()
  const [nome, setNome] = useState<string | null>(null)
  const valorNome = nome ?? perfil?.nome ?? ''

  async function salvarNome(e: FormEvent) {
    e.preventDefault()
    try {
      await salvar.mutateAsync({ nome: valorNome.trim() || null, tema })
      setNome(null)
      toast.success('Salvo ✓')
    } catch (erro) {
      console.error(erro)
      toast.error('Não foi salvo — tente de novo.')
    }
  }

  return (
    <Card>
      <TituloCard>Conta</TituloCard>
      <p className="truncate text-sm text-muted">{user?.email}</p>

      <form onSubmit={salvarNome} className="flex items-end gap-2">
        <div className="flex-1">
          <Campo
            label="Como quer ser chamado"
            value={valorNome}
            maxLength={60}
            placeholder="Seu nome"
            disabled={isLoading}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <Botao
          type="submit"
          variante="secundario"
          className="min-h-13"
          carregando={salvar.isPending}
          disabled={!online || nome === null}
        >
          Salvar
        </Botao>
      </form>

      <Botao variante="secundario" onClick={sair} className="self-start">
        <LogOut className="size-4" aria-hidden />
        Sair
      </Botao>
    </Card>
  )
}

function SecaoAparencia() {
  const { tema, definirTema } = useTema()
  const { data: perfil } = usePerfil()
  const salvar = useSalvarPerfil()

  function escolher(novo: TemaEscolha) {
    if (novo === tema) return
    definirTema(novo) // aplica na hora e guarda neste aparelho
    salvar.mutate(
      { tema: novo, nome: perfil?.nome ?? null },
      {
        onError: (e) => {
          console.error(e)
          toast.error('Tema aplicado só neste aparelho: não foi possível salvar na sua conta.')
        },
      },
    )
  }

  return (
    <Card>
      <TituloCard>Aparência</TituloCard>
      <div role="radiogroup" aria-label="Tema" className="grid grid-cols-2 gap-3">
        {OPCOES_TEMA.map((o) => {
          const ativo = o.valor === tema
          return (
            <button
              key={o.valor}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => escolher(o.valor)}
              className={cn(
                'flex flex-col gap-2 rounded-2xl p-2 text-left transition-colors',
                ativo ? 'border-2 border-primary' : 'border border-border hover:bg-track',
              )}
            >
              <PreviaTema valor={o.valor} />
              <span className="flex items-center justify-between gap-1 px-1">
                <span className="text-sm font-bold">{o.nome}</span>
                {ativo && <Check className="size-4 text-primary" aria-hidden />}
              </span>
              <span className="px-1 pb-1 text-xs text-muted">{o.descricao}</span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/** Miniatura do tema: usa o próprio data-theme, então só tokens (nenhuma cor fixa). */
function PreviaTema({ valor }: { valor: TemaEscolha }) {
  if (valor === 'automatico') {
    return (
      <span className="grid h-16 grid-cols-2 overflow-hidden rounded-xl" aria-hidden>
        <Miniatura tema="clareza" />
        <Miniatura tema="noite" />
      </span>
    )
  }
  return (
    <span className="grid h-16 overflow-hidden rounded-xl" aria-hidden>
      <Miniatura tema={valor} />
    </span>
  )
}

function Miniatura({ tema }: { tema: Exclude<TemaEscolha, 'automatico'> }) {
  return (
    <span data-theme={tema} className="flex flex-col gap-1.5 border border-border bg-bg p-2">
      <span className="h-5 rounded-md bg-hero-bg" />
      <span className="flex gap-1">
        <span className="h-2 flex-1 rounded-full bg-primary" />
        <span className="h-2 flex-1 rounded-full bg-track" />
      </span>
    </span>
  )
}
