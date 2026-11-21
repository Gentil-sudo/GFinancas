import { ChevronRight, DatabaseBackup, Rocket } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { AvatarUsuario } from '@/components/ui/CabecalhoPagina'
import { Esqueleto } from '@/components/ui/Esqueleto'
import { SeletorMes } from '@/components/ui/SeletorMes'
import { useAuth } from '@/features/auth/authContext'
import { diasDesdeBackup, textoUltimoBackup } from '@/features/configuracoes/backup'
import { useLancamentosMes, useResumo } from '@/features/lancamentos/api'
import { nomeExibicao, usePerfil } from '@/features/perfil/api'
import { somarMeses } from '@/lib/format'
import { useMes } from '@/lib/mesContext'
import { useDeslizar } from '@/lib/useDeslizar'
import type { ResumoMensal } from '@/types/db'
import { useMetas } from '@/features/metas/api'
import { useComprasParceladas } from '@/features/parcelas/api'
import { proximaQueda } from '@/features/parcelas/calculos'
import { CardContas } from './CardContas'
import { CardMetas } from './CardMetas'
import { CardSobra } from './CardSobra'
import { CardsPatrimonio } from './CardsPatrimonio'
import { ParaOndeFoi } from './ParaOndeFoi'
import { ProximosVencimentos } from './ProximosVencimentos'

const MESES_EVOLUCAO = 6

// O gráfico (Recharts) é pesado: só é baixado quando o Início abre.
const GraficoEvolucao = lazy(() =>
  import('./GraficoEvolucao').then((m) => ({ default: m.GraficoEvolucao })),
)

function resumoVazio(competencia: string): ResumoMensal {
  return {
    user_id: '',
    competencia,
    total_entradas: 0,
    total_saidas: 0,
    total_pago: 0,
    total_pendente: 0,
    resultado: 0,
    total_investido: 0,
    total: 0,
  }
}

export function DashboardPage() {
  const { user } = useAuth()
  const { data: perfil } = usePerfil()
  const { mes, mudarMes } = useMes()
  const deslizar = useDeslizar(
    () => mudarMes(1),
    () => mudarMes(-1),
  )

  const meses = useMemo(
    () => Array.from({ length: MESES_EVOLUCAO }, (_, i) => somarMeses(mes, i - MESES_EVOLUCAO + 1)),
    [mes],
  )
  const mesAnterior = somarMeses(mes, -1)

  const resumo = useResumo(meses[0], mes)
  const lancamentos = useLancamentosMes(mes)
  const { resumos: compras } = useComprasParceladas()
  const { data: metas } = useMetas()

  const atual = resumo.data?.find((r) => r.competencia === mes) ?? resumoVazio(mes)
  const anterior = resumo.data?.find((r) => r.competencia === mesAnterior)
  const semNada =
    !lancamentos.isLoading &&
    (lancamentos.data?.length ?? 0) === 0 &&
    compras.length === 0 &&
    (metas?.length ?? 0) === 0
  const [diasBackup] = useState(diasDesdeBackup)
  const carregando = resumo.isLoading || lancamentos.isLoading
  const erro = resumo.isError || lancamentos.isError

  return (
    <div className="flex flex-col gap-[18px]" {...deslizar}>
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-muted">Olá,</span>
          <h1 className="text-[22px] font-bold">{nomeExibicao(perfil, user?.email)}</h1>
        </div>
        <AvatarUsuario />
      </header>

      <SeletorMes />

      {erro ? (
        <Aviso tipo="erro">
          Não foi possível carregar o resumo.{' '}
          <button
            type="button"
            className="font-bold underline"
            onClick={() => {
              void resumo.refetch()
              void lancamentos.refetch()
            }}
          >
            Tentar de novo
          </button>
        </Aviso>
      ) : carregando ? (
        <div className="flex flex-col gap-[18px]" role="status">
          <span className="sr-only">Carregando…</span>
          <Esqueleto className="h-44" />
          <Esqueleto className="h-28" />
          <Esqueleto className="h-48" />
        </div>
      ) : (
        <>
          {semNada && (
            <Link
              to="/configuracao-inicial"
              className="flex items-center gap-3 rounded-card border border-primary bg-primary-soft p-4 text-sm"
            >
              <Rocket className="size-6 shrink-0 text-primary" aria-hidden />
              <span className="flex-1">
                <strong className="block text-text">Primeira vez por aqui?</strong>
                <span className="text-muted">
                  Faça a configuração inicial: parcelas em andamento, metas e investimentos.
                </span>
              </span>
              <ChevronRight className="size-5 text-primary" aria-hidden />
            </Link>
          )}
          <CardSobra atual={atual} anterior={anterior} mesAnterior={mesAnterior} />
          <CardContas resumo={atual} />
          <ProximosVencimentos />
          <ParaOndeFoi lancamentos={lancamentos.data ?? []} />
          <CardsPatrimonio
            resumo={atual}
            lancamentos={lancamentos.data ?? []}
            queda={proximaQueda(compras, mes)}
          />
          <CardMetas metas={metas ?? []} mes={mes} />
          <Suspense fallback={<Esqueleto className="h-72" />}>
            <GraficoEvolucao meses={meses} resumos={resumo.data ?? []} />
          </Suspense>
          {!semNada && (diasBackup === null || diasBackup > 30) && (
            <Link
              to="/configuracoes/backup"
              className="flex min-h-11 items-center justify-center gap-1.5 text-[13px] text-muted hover:text-primary"
            >
              <DatabaseBackup className="size-4" aria-hidden />
              {textoUltimoBackup(diasBackup)} Fazer backup
            </Link>
          )}
        </>
      )}
    </div>
  )
}
