import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  Plus,
  Rocket,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Aviso } from '@/components/ui/Aviso'
import { BarraProgresso } from '@/components/ui/BarraProgresso'
import { Botao } from '@/components/ui/Botao'
import { Card } from '@/components/ui/Card'
import { classeCampo } from '@/components/ui/estilos'
import { useCategorias } from '@/features/categorias/api'
import { FormInvestimento } from '@/features/investimentos/FormInvestimento'
import { nomeTipo, totalDoMes, useInvestimentos } from '@/features/investimentos/api'
import { useAcoesLancamento, useLancamentosMes } from '@/features/lancamentos/api'
import { useMetas } from '@/features/metas/api'
import { saldoMeta } from '@/features/metas/calculos'
import { useComprasParceladas } from '@/features/parcelas/api'
import { competencia, formatBRL, formatValorCampo, hoje, nomeMes, parseValor } from '@/lib/format'
import { useOnline } from '@/lib/online'

const PASSOS = [
  { titulo: 'Bem-vindo', icone: Rocket },
  { titulo: 'Dinheiro disponível', icone: Wallet },
  { titulo: 'Parcelas em andamento', icone: Layers },
  { titulo: 'Metas', icone: Target },
  { titulo: 'Investimentos', icone: TrendingUp },
] as const

const DESCRICAO_SALDO = 'Saldo anterior'

/**
 * Assistente de primeiro acesso: cadastrar o estado atual à mão, passo a passo.
 * Cada passo salva na hora; dá para parar e continuar depois (o passo fica na URL).
 */
export function ConfiguracaoInicialPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const passo = Math.min(PASSOS.length - 1, Math.max(0, Number(params.get('passo') ?? 0) || 0))
  const ir = (n: number) => setParams({ passo: String(n) })
  const voltarAqui = encodeURIComponent(`/configuracao-inicial?passo=${passo}`)
  const Icone = PASSOS[passo].icone

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-muted">
          Configuração inicial · passo {passo + 1} de {PASSOS.length}
        </span>
        <BarraProgresso
          porcentagem={((passo + 1) / PASSOS.length) * 100}
          altura="fina"
          rotulo={`Passo ${passo + 1} de ${PASSOS.length}`}
        />
      </div>

      <header className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Icone className="size-6" aria-hidden />
        </span>
        <h1 className="text-[24px] font-bold tracking-tight">{PASSOS[passo].titulo}</h1>
      </header>

      {passo === 0 && <PassoBoasVindas />}
      {passo === 1 && <PassoSaldo />}
      {passo === 2 && <PassoParcelas voltarAqui={voltarAqui} />}
      {passo === 3 && <PassoMetas voltarAqui={voltarAqui} />}
      {passo === 4 && <PassoInvestimentos />}

      <div className="flex gap-2">
        {passo > 0 && (
          <Botao variante="secundario" onClick={() => ir(passo - 1)}>
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </Botao>
        )}
        {passo < PASSOS.length - 1 ? (
          <Botao className="flex-1" onClick={() => ir(passo + 1)}>
            {passo === 0 ? 'Começar' : 'Próximo'}
            <ArrowRight className="size-4" aria-hidden />
          </Botao>
        ) : (
          <Botao
            className="flex-1"
            onClick={() => {
              toast.success('Tudo pronto ✓ Bom controle!')
              navigate('/')
            }}
          >
            <Check className="size-4" aria-hidden />
            Concluir
          </Botao>
        )}
      </div>
    </>
  )
}

function PassoBoasVindas() {
  return (
    <Card>
      <p>
        Vamos cadastrar como suas finanças estão <strong>hoje</strong>: o dinheiro disponível, as
        compras parceladas que você ainda está pagando, as metas e os investimentos.
      </p>
      <p className="text-sm text-muted">
        Cada passo salva na hora. Pode pular o que não tiver e voltar aqui depois em Configurações →
        Configuração inicial.
      </p>
    </Card>
  )
}

function PassoSaldo() {
  const mes = competencia()
  const online = useOnline()
  const { data: lancamentos } = useLancamentosMes(mes)
  const { data: categorias } = useCategorias()
  const { criar } = useAcoesLancamento()
  const [valor, setValor] = useState('')
  const [salvando, setSalvando] = useState(false)
  const existente = lancamentos?.find(
    (l) => l.descricao === DESCRICAO_SALDO && l.tipo === 'entrada',
  )

  async function salvar() {
    const v = parseValor(valor)
    if (!v || v <= 0) return
    setSalvando(true)
    const outros = categorias?.find((c) => c.tipo === 'entrada' && c.nome === 'Outros')
    await criar({
      tipo: 'entrada',
      descricao: DESCRICAO_SALDO,
      categoria_id: outros?.id ?? null,
      valor: v,
      competencia: mes,
      data: hoje(),
      status: 'pago',
      observacao: 'Cadastrado na configuração inicial',
    })
    setSalvando(false)
    setValor('')
  }

  return (
    <Card>
      <p>
        Quanto dinheiro você tem disponível hoje (conta corrente, carteira), fora investimentos e
        metas?
      </p>
      <p className="text-sm text-muted">
        Entra como uma entrada “{DESCRICAO_SALDO}” em {nomeMes(mes)}, para a sobra do mês refletir o
        que você realmente tem. Opcional.
      </p>
      {existente ? (
        <Aviso tipo="sucesso">
          Já cadastrado: <strong className="valor">{formatBRL(existente.valor)}</strong>. Para
          mudar, edite em Lançamentos.
        </Aviso>
      ) : (
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="saldo-inicial">
            Dinheiro disponível
          </label>
          <input
            id="saldo-inicial"
            inputMode="decimal"
            placeholder="R$ 0,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => {
              const v = parseValor(valor)
              if (v) setValor(formatValorCampo(v))
            }}
            className={`${classeCampo} flex-1 valor`}
          />
          <Botao
            className="min-h-13"
            carregando={salvando}
            disabled={!online || !parseValor(valor)}
            onClick={salvar}
          >
            Salvar
          </Botao>
        </div>
      )}
    </Card>
  )
}

function PassoParcelas({ voltarAqui }: { voltarAqui: string }) {
  const { resumos } = useComprasParceladas()
  const ativas = resumos.filter((r) => !r.finalizada)
  return (
    <Card>
      <p>
        Cadastre as compras parceladas que você <strong>ainda está pagando</strong>. Informe em qual
        parcela está (ex.: 4 de 12): o app cria só as que faltam.
      </p>
      {ativas.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border">
          {ativas.map((r) => (
            <li key={r.compra.id} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="font-semibold">{r.compra.descricao}</span>
              <span className="text-muted valor">
                {r.pagas}/{r.total} · {formatBRL(r.compra.valor_parcela)}/mês
              </span>
            </li>
          ))}
        </ul>
      )}
      <LinkAdicionar to={`/parcelas/nova?andamento=1&voltar=${voltarAqui}`}>
        {ativas.length > 0 ? 'Adicionar outra compra' : 'Adicionar compra em andamento'}
      </LinkAdicionar>
    </Card>
  )
}

function PassoMetas({ voltarAqui }: { voltarAqui: string }) {
  const { data: metas } = useMetas()
  const lista = (metas ?? []).filter((m) => !m.arquivada)
  return (
    <Card>
      <p>
        Crie suas caixinhas (ex.: <strong>Casamento</strong>, <strong>Móveis</strong>) com o quanto
        você já tem guardado em cada uma.
      </p>
      {lista.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border">
          {lista.map((m) => (
            <li key={m.id} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="font-semibold">{m.nome}</span>
              <span className="text-muted valor">{formatBRL(saldoMeta(m.meta_movimentos))}</span>
            </li>
          ))}
        </ul>
      )}
      <LinkAdicionar to={`/metas/nova?voltar=${voltarAqui}`}>
        {lista.length > 0 ? 'Adicionar outra meta' : 'Adicionar meta'}
      </LinkAdicionar>
    </Card>
  )
}

function PassoInvestimentos() {
  const mes = competencia()
  const { data } = useInvestimentos(mes, mes)
  const [aberto, setAberto] = useState(false)
  const lista = data ?? []
  return (
    <Card>
      <p>
        Registre o saldo de hoje em cada investimento (Ações, Fundos, ETF, Exterior, Renda Fixa).
      </p>
      {lista.length > 0 && (
        <>
          <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border">
            {lista.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="font-semibold">{i.descricao || nomeTipo(i.tipo)}</span>
                <span className="text-muted valor">{formatBRL(i.valor_brl)}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm valor">
            Total: <strong>{formatBRL(totalDoMes(lista, mes))}</strong>
          </p>
        </>
      )}
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-border font-bold text-primary hover:bg-bg"
      >
        <Plus className="size-4" aria-hidden />
        Adicionar saldo
      </button>
      <FormInvestimento
        aberta={aberto}
        original={null}
        mes={mes}
        onFechar={() => setAberto(false)}
      />
    </Card>
  )
}

function LinkAdicionar({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-border font-bold text-primary hover:bg-bg"
    >
      <Plus className="size-4" aria-hidden />
      {children}
    </Link>
  )
}
