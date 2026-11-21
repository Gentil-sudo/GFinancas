import { zodResolver } from '@hookform/resolvers/zod'
import { differenceInCalendarMonths, parseISO } from 'date-fns'
import { FileQuestion, Trash2, WifiOff, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useParams, useSearchParams } from 'react-router'
import { z } from 'zod'
import { Botao } from '@/components/ui/Botao'
import { CampoRotulado as Campo } from '@/components/ui/Campo'
import { EstadoVazio } from '@/components/ui/EstadoVazio'
import { classeCampo } from '@/components/ui/estilos'
import { TelaCarregando } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import {
  competencia,
  formatBRL,
  formatMes,
  formatValorCampo,
  parseValor,
  somarMeses,
} from '@/lib/format'
import { useOnline } from '@/lib/online'
import { rotaVoltar } from '@/lib/rotaVoltar'
import { useSaidaFormulario } from '@/lib/useSaidaFormulario'
import type { Meta } from '@/types/db'
import { useAcoesMeta, useMetas } from './api'

const dinheiroOpcional = (rotulo: string) =>
  z
    .string()
    .refine(
      (s) => !s.trim() || (parseValor(s) ?? 0) > 0,
      `${rotulo}: informe um valor maior que zero.`,
    )

const schema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(1, 'Dê um nome à meta (ex.: "Casamento").')
      .max(60, 'Use no máximo 60 caracteres.'),
    alvo: dinheiroOpcional('Valor-alvo'),
    plano: dinheiroOpcional('Aporte mensal'),
    inicio: z.string(),
    fim: z.string(),
    saldoInicial: dinheiroOpcional('Saldo inicial'),
  })
  .refine((d) => !d.inicio || !d.fim || d.fim >= d.inicio, {
    message: 'O prazo precisa ser depois do início.',
    path: ['fim'],
  })
type Dados = z.infer<typeof schema>

export function FormMetaPage({ modo }: { modo: 'nova' | 'editar' }) {
  const { id } = useParams()
  const { data, isLoading } = useMetas()
  const original = modo === 'editar' ? data?.find((m) => m.id === id) : undefined

  if (modo === 'editar') {
    if (isLoading) return <TelaCarregando />
    if (!original) {
      return (
        <div className="mx-auto max-w-lg px-5 pt-10">
          <EstadoVazio
            icone={FileQuestion}
            titulo="Meta não encontrada"
            texto="Ela pode ter sido excluída."
          />
        </div>
      )
    }
  }
  return <Formulario key={original?.id ?? 'nova'} original={original ?? null} />
}

const campoDinheiro = (n: number | null) => (n !== null ? formatValorCampo(Number(n)) : '')

function Formulario({ original }: { original: Meta | null }) {
  const editando = Boolean(original)
  const idBase = useId()
  const online = useOnline()
  const { criar, editar, excluir } = useAcoesMeta()
  const [excluindo, setExcluindo] = useState(false)
  const atual = competencia()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Dados>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: original?.nome ?? '',
      alvo: campoDinheiro(original?.valor_alvo ?? null),
      plano: campoDinheiro(original?.aporte_mensal_planejado ?? null),
      inicio: original?.inicio ?? atual,
      fim: original?.fim ?? '',
      saldoInicial: '',
    },
  })
  const [params] = useSearchParams()
  const destino = rotaVoltar(params, '/metas')
  const { concluir, fechar } = useSaidaFormulario(isDirty, destino)
  const [alvo, plano, inicio, fim] = useWatch({ control, name: ['alvo', 'plano', 'inicio', 'fim'] })

  const opcoesMes = useMemo(
    () => Array.from({ length: 121 }, (_, i) => somarMeses(atual, i - 36)),
    [atual],
  )

  // "Pouca digitação": com aporte mensal + início + prazo, sugere o valor-alvo.
  const valorPlano = parseValor(plano)
  const sugestaoAlvo =
    !parseValor(alvo) && valorPlano && inicio && fim && fim >= inicio
      ? {
          meses: differenceInCalendarMonths(parseISO(fim), parseISO(inicio)) + 1,
          valor: 0,
        }
      : null
  if (sugestaoAlvo) sugestaoAlvo.valor = sugestaoAlvo.meses * valorPlano!

  const formatarAoSair =
    (campo: 'alvo' | 'plano' | 'saldoInicial') => (e: { target: { value: string } }) => {
      const v = parseValor(e.target.value)
      if (v !== null && v > 0) setValue(campo, formatValorCampo(v))
    }

  async function salvar(d: Dados) {
    const dados = {
      nome: d.nome.trim(),
      valor_alvo: parseValor(d.alvo),
      aporte_mensal_planejado: parseValor(d.plano),
      inicio: d.inicio || null,
      fim: d.fim || null,
    }
    const ok = original
      ? await editar(original.id, dados)
      : await criar(dados, parseValor(d.saldoInicial))
    if (ok) concluir(params.get('voltar') ? destino : undefined)
  }

  async function excluirMeta() {
    if (!original) return
    if (!window.confirm(`Mover a meta "${original.nome}" para a lixeira?`)) return
    setExcluindo(true)
    const ok = await excluir(original)
    setExcluindo(false)
    if (ok !== undefined) concluir('/metas')
  }

  const regAlvo = register('alvo')
  const regPlano = register('plano')
  const regSaldo = register('saldoInicial')

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-[18px] px-5 pt-6 pb-12">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-bold tracking-tight">
          {editando ? 'Editar meta' : 'Nova meta'}
        </h1>
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-text hover:bg-track"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <form onSubmit={handleSubmit(salvar)} noValidate className="flex flex-col gap-[18px]">
        <Campo rotulo="Nome" id={`${idBase}-nome`} erro={errors.nome?.message}>
          <input
            id={`${idBase}-nome`}
            placeholder="Ex.: Casamento"
            autoFocus={!editando}
            className={classeCampo}
            aria-invalid={errors.nome ? true : undefined}
            {...register('nome')}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo
            rotulo="Aporte por mês"
            id={`${idBase}-plano`}
            erro={errors.plano?.message}
            dica="Opcional"
          >
            <input
              id={`${idBase}-plano`}
              inputMode="decimal"
              placeholder="2.666,00"
              className={cn(classeCampo, 'valor')}
              {...regPlano}
              onBlur={(e) => {
                void regPlano.onBlur(e)
                formatarAoSair('plano')(e)
              }}
            />
          </Campo>
          <Campo
            rotulo="Valor-alvo"
            id={`${idBase}-alvo`}
            erro={errors.alvo?.message}
            dica="Opcional"
          >
            <input
              id={`${idBase}-alvo`}
              inputMode="decimal"
              placeholder="47.988,00"
              className={cn(classeCampo, 'valor')}
              {...regAlvo}
              onBlur={(e) => {
                void regAlvo.onBlur(e)
                formatarAoSair('alvo')(e)
              }}
            />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Início" id={`${idBase}-inicio`}>
            <select id={`${idBase}-inicio`} className={classeCampo} {...register('inicio')}>
              {opcoesMes.map((m) => (
                <option key={m} value={m}>
                  {formatMes(m)}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Prazo" id={`${idBase}-fim`} erro={errors.fim?.message}>
            <select id={`${idBase}-fim`} className={classeCampo} {...register('fim')}>
              <option value="">Sem prazo</option>
              {opcoesMes.map((m) => (
                <option key={m} value={m}>
                  {formatMes(m)}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {sugestaoAlvo && (
          <button
            type="button"
            onClick={() =>
              setValue('alvo', formatValorCampo(sugestaoAlvo.valor), { shouldDirty: true })
            }
            className="-mt-1 rounded-2xl bg-primary-soft px-4 py-3 text-left text-sm text-text hover:opacity-90"
          >
            {sugestaoAlvo.meses} meses × {formatBRL(valorPlano!)} ={' '}
            <strong className="valor">{formatBRL(sugestaoAlvo.valor)}</strong>.{' '}
            <span className="font-semibold text-primary">Usar como valor-alvo</span>
          </button>
        )}

        {!editando && (
          <Campo
            rotulo="Já tenho guardado"
            id={`${idBase}-saldo`}
            erro={errors.saldoInicial?.message}
            dica="Opcional. Entra como aporte “Saldo inicial” neste mês."
          >
            <input
              id={`${idBase}-saldo`}
              inputMode="decimal"
              placeholder="0,00"
              className={cn(classeCampo, 'valor')}
              {...regSaldo}
              onBlur={(e) => {
                void regSaldo.onBlur(e)
                formatarAoSair('saldoInicial')(e)
              }}
            />
          </Campo>
        )}

        {!online && (
          <p className="flex items-center gap-2 text-sm font-semibold text-danger" role="alert">
            <WifiOff className="size-4" aria-hidden />
            Sem internet: conecte-se para salvar.
          </p>
        )}

        <Botao
          type="submit"
          tamanho="grande"
          larguraTotal
          carregando={isSubmitting}
          disabled={!online}
          className="text-[17px] font-bold"
        >
          {editando ? 'Salvar alterações' : 'Criar meta'}
        </Botao>

        {editando && (
          <Botao
            variante="fantasma"
            className="text-danger"
            carregando={excluindo}
            disabled={!online}
            onClick={excluirMeta}
          >
            <Trash2 className="size-4" aria-hidden />
            Excluir meta (vai para a lixeira)
          </Botao>
        )}
      </form>
    </div>
  )
}
