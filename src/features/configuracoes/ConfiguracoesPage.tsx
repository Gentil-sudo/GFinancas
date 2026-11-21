import {
  Check,
  ChevronRight,
  DatabaseBackup,
  History,
  KeyRound,
  LogOut,
  Rocket,
  Tags,
  Trash2,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
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
import { diasDesdeBackup, textoUltimoBackup } from './backup'
import { TrocarSenha } from './TrocarSenha'

export function ConfiguracoesPage() {
  return (
    <>
      <CabecalhoPagina titulo="Configurações" />
      <SecaoConta />
      <SecaoAparencia />

      <nav
        aria-label="Seções"
        className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface"
      >
        <ItemMenu to="/investimentos" icone={TrendingUp} titulo="Investimentos" soCelular />
        <ItemMenu
          to="/configuracoes/backup"
          icone={DatabaseBackup}
          titulo="Backup"
          detalhe={textoUltimoBackup(diasDesdeBackup())}
        />
        <ItemMenu to="/configuracoes/categorias" icone={Tags} titulo="Categorias" />
        <ItemMenu to="/configuracoes/lixeira" icone={Trash2} titulo="Lixeira" />
        <ItemMenu to="/configuracoes/historico" icone={History} titulo="Histórico de alterações" />
        <ItemMenu
          to="/configuracao-inicial"
          icone={Rocket}
          titulo="Configuração inicial"
          detalhe="Cadastrar parcelas, metas e investimentos que você já tem"
        />
      </nav>
    </>
  )
}

function ItemMenu({
  to,
  icone: Icone,
  titulo,
  detalhe,
  soCelular = false,
}: {
  to: string
  icone: LucideIcon
  titulo: string
  detalhe?: string
  soCelular?: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex min-h-14 items-center gap-3 px-5 py-3 hover:bg-bg',
        soCelular && 'md:hidden',
      )}
    >
      <Icone className="size-5 shrink-0 text-primary" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">{titulo}</span>
        {detalhe && <span className="text-[13px] text-muted">{detalhe}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </Link>
  )
}

function SecaoConta() {
  const { user, sair } = useAuth()
  const { data: perfil, isLoading } = usePerfil()
  const { tema } = useTema()
  const salvar = useSalvarPerfil()
  const online = useOnline()
  const [nome, setNome] = useState<string | null>(null)
  const [trocarSenha, setTrocarSenha] = useState(false)
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

      <div className="flex flex-wrap gap-2">
        <Botao variante="secundario" onClick={() => setTrocarSenha(true)}>
          <KeyRound className="size-4" aria-hidden />
          Trocar senha
        </Botao>
        <Botao variante="secundario" onClick={sair}>
          <LogOut className="size-4" aria-hidden />
          Sair
        </Botao>
      </div>
      <TrocarSenha aberta={trocarSenha} onFechar={() => setTrocarSenha(false)} />
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
