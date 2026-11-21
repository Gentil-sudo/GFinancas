import { zodResolver } from '@hookform/resolvers/zod'
import { parseISO } from 'date-fns'
import { FileQuestion, Layers, WifiOff, X } from 'lucide-react'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useParams, useSearchParams } from 'react-router'
import { z } from 'zod'
import { Botao } from '@/components/ui/Botao'
import { MensagemCampo } from '@/components/ui/Campo'
import { classeCampo, classeRotulo } from '@/components/ui/estilos'
import { EstadoVazio } from '@/components/ui/EstadoVazio'
import { IconeLucide } from '@/components/ui/IconeCategoria'
import { Segmentado } from '@/components/ui/Segmentado'
import { TelaCarregando } from '@/components/ui/Spinner'
import { useCategorias } from '@/features/categorias/api'
import { cn } from '@/lib/cn'
import {
  competencia as competenciaDe,
  formatMes,
  formatValorCampo,
  hoje,
  parseValor,
  somarMeses,
} from '@/lib/format'
import { useMes } from '@/lib/mesContext'
import { useOnline } from '@/lib/online'
import { useSaidaFormulario } from '@/lib/useSaidaFormulario'
import type { Lancamento, StatusLancamento, TipoLancamento } from '@/types/db'
import {
  normalizarTexto,
  useAcoesLancamento,
  useLancamento,
  useSugestoesDescricao,
  type DadosLancamento,
} from './api'
import { nomeStatus } from './status'

type Modo = 'novo' | 'editar' | 'duplicar'

const schema = z
  .object({
    tipo: z.enum(['saida', 'entrada']),
    valor: z.string(),
    descricao: z
      .string()
      .trim()
      .min(1, 'Descreva o lançamento (ex.: "Conta de luz").')
      .max(120, 'Use no máximo 120 caracteres.'),
    categoria_id: z.string().min(1, 'Escolha uma categoria.'),
    data: z.string().min(1, 'Informe a data.'),
    competencia: z.string().min(1),
    status: z.enum(['pago', 'pendente', 'parcial']),
    valor_pago: z.string(),
    vencimento: z.string(),
    observacao: z.string().max(500, 'Use no máximo 500 caracteres.'),
  })
  .superRefine((d, ctx) => {
    const valor = parseValor(d.valor)
    if (valor === null || valor <= 0) {
      ctx.addIssue({ code: 'custom', path: ['valor'], message: 'Informe um valor maior que zero.' })
    } else if (valor > 9_999_999_999) {
      ctx.addIssue({ code: 'custom', path: ['valor'], message: 'Valor alto demais.' })
    }
    if (d.status === 'parcial') {
      const pago = parseValor(d.valor_pago)
      if (pago === null || pago <= 0) {
        ctx.addIssue({ code: 'custom', path: ['valor_pago'], message: 'Quanto já foi pago?' })
      } else if (valor !== null && pago >= valor) {
        ctx.addIssue({
          code: 'custom',
          path: ['valor_pago'],
          message: 'Precisa ser menor que o total. Se pagou tudo, marque "Pago".',
        })
      }
    }
  })

type FormDados = z.infer<typeof schema>

export function FormLancamentoPage({ modo }: { modo: Modo }) {
  const { id } = useParams()
  const { data: original, isLoading, isError } = useLancamento(modo === 'novo' ? undefined : id)

  if (modo !== 'novo') {
    if (isLoading) return <TelaCarregando />
    if (isError || !original) {
      return (
        <div className="mx-auto max-w-lg px-5 pt-10">
          <EstadoVazio
            icone={FileQuestion}
            titulo="Lançamento não encontrado"
            texto="Ele pode ter sido excluído ou o link está errado."
          />
        </div>
      )
    }
  }
  return <Formulario key={original?.id ?? 'novo'} modo={modo} original={original ?? null} />
}

function valoresIniciais(
  modo: Modo,
  original: Lancamento | null,
  mes: string,
  tipoUrl: string | null,
): FormDados {
  if (original) {
    return {
      tipo: original.tipo,
      valor: formatValorCampo(Number(original.valor)),
      descricao: original.descricao,
      categoria_id: original.categoria_id ?? '',
      data: modo === 'duplicar' ? hoje() : original.data,
      competencia: modo === 'duplicar' ? competenciaDe() : original.competencia,
      status: original.status,
      valor_pago:
        original.status === 'parcial' ? formatValorCampo(Number(original.valor_pago)) : '',
      vencimento: original.vencimento ?? '',
      observacao: original.observacao ?? '',
    }
  }
  const noMesAtual = mes === competenciaDe()
  return {
    tipo: tipoUrl === 'entrada' ? 'entrada' : 'saida',
    valor: '',
    descricao: '',
    categoria_id: '',
    data: noMesAtual ? hoje() : mes,
    competencia: mes,
    status: 'pago',
    valor_pago: '',
    vencimento: '',
    observacao: '',
  }
}

const TITULOS: Record<Modo, string> = {
  novo: 'Novo lançamento',
  editar: 'Editar lançamento',
  duplicar: 'Duplicar lançamento',
}

function Formulario({ modo, original }: { modo: Modo; original: Lancamento | null }) {
  const [params] = useSearchParams()
  const { mes } = useMes()
  const online = useOnline()
  const { criar, editar } = useAcoesLancamento()
  const { data: categorias } = useCategorias()
  const { data: sugestoes } = useSugestoesDescricao()
  const idBase = useId()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isDirty, isSubmitting, isSubmitted },
  } = useForm<FormDados>({
    resolver: zodResolver(schema),
    defaultValues: valoresIniciais(modo, original, mes, params.get('tipo')),
  })

  const [tipo, status, descricao, compSelecionada] = useWatch({
    control,
    name: ['tipo', 'status', 'descricao', 'competencia'],
  })

  // ---------- aviso ao sair com alterações não salvas (PLANO §5.6)
  const { concluir, fechar } = useSaidaFormulario(isDirty, '/lancamentos')

  /** "É uma compra parcelada?": leva o que já foi digitado para o cadastro de parcelas. */
  function irParaParcelas() {
    const p = new URLSearchParams()
    const v = getValues()
    if (v.descricao.trim()) p.set('descricao', v.descricao.trim())
    if (parseValor(v.valor)) p.set('valor', v.valor)
    if (v.categoria_id) p.set('categoria', v.categoria_id)
    concluir(`/parcelas/nova?${p.toString()}`)
  }

  // ---------- categorias do tipo escolhido
  const categoriasDoTipo = useMemo(
    () =>
      (categorias ?? []).filter(
        (c) => c.tipo === tipo && (!c.arquivada || c.id === original?.categoria_id),
      ),
    [categorias, tipo, original?.categoria_id],
  )

  function mudarTipo(novo: TipoLancamento) {
    setValue('tipo', novo, { shouldDirty: true })
    const cat = categorias?.find((c) => c.id === getValues('categoria_id'))
    if (cat && cat.tipo !== novo) setValue('categoria_id', '', { shouldDirty: true })
  }

  // ---------- autocompletar descrição
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const sugestoesFiltradas = useMemo(() => {
    const termo = normalizarTexto(descricao ?? '')
    if (termo.length < 2) return []
    return (sugestoes ?? [])
      .filter((s) => s.tipo === tipo)
      .filter((s) => {
        const d = normalizarTexto(s.descricao)
        return d.includes(termo) && d !== termo
      })
      .slice(0, 3)
  }, [descricao, sugestoes, tipo])

  function usarSugestao(s: (typeof sugestoesFiltradas)[number]) {
    setValue('descricao', s.descricao, { shouldDirty: true, shouldValidate: isSubmitted })
    if (s.categoria_id && categorias?.some((c) => c.id === s.categoria_id && c.tipo === tipo)) {
      setValue('categoria_id', s.categoria_id, { shouldDirty: true, shouldValidate: isSubmitted })
    }
    if (!parseValor(getValues('valor'))) {
      setValue('valor', formatValorCampo(Number(s.valor)), { shouldDirty: true })
    }
    setMostrarSugestoes(false)
  }

  // ---------- competência acompanha a data, até o usuário escolher outra
  const [competenciaManual, setCompetenciaManual] = useState(modo === 'editar')
  const dataReg = register('data')
  const valorReg = register('valor')

  const opcoesCompetencia = useMemo(() => {
    const base = compSelecionada || mes
    return Array.from({ length: 25 }, (_, i) => somarMeses(base, i - 12))
  }, [compSelecionada, mes])

  // ---------- salvar
  async function salvar(f: FormDados) {
    const valor = parseValor(f.valor)!
    const dados: DadosLancamento = {
      tipo: f.tipo,
      descricao: f.descricao.trim(),
      categoria_id: f.categoria_id,
      valor,
      competencia: f.competencia,
      data: f.data,
      status: f.status,
      valor_pago: f.status === 'parcial' ? parseValor(f.valor_pago)! : 0,
      vencimento: f.vencimento || null,
      data_pagamento:
        f.status === 'pendente'
          ? null
          : modo === 'editar' && original?.data_pagamento
            ? original.data_pagamento
            : f.data,
      observacao: f.observacao.trim() || null,
    }

    const resultado = modo === 'editar' ? await editar(original!, dados) : await criar(dados)
    // Se não salvou, o formulário continua preenchido para tentar de novo.
    if (resultado) concluir()
  }

  const opcoesStatus: StatusLancamento[] = ['pago', 'pendente', 'parcial']

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-[18px] px-5 pt-6 pb-12">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-bold tracking-tight">{TITULOS[modo]}</h1>
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
        <Segmentado
          rotulo="Tipo de lançamento"
          valor={tipo}
          onChange={mudarTipo}
          opcoes={[
            { valor: 'saida', rotulo: '− Saída' },
            { valor: 'entrada', rotulo: '+ Entrada' },
          ]}
        />

        {/* Valor */}
        <div className="flex flex-col items-center gap-1.5 py-2">
          <label htmlFor={`${idBase}-valor`} className={classeRotulo}>
            Valor
          </label>
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-display text-2xl font-bold text-muted" aria-hidden>
              R$
            </span>
            <input
              id={`${idBase}-valor`}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              autoFocus={modo === 'novo'}
              aria-invalid={errors.valor ? true : undefined}
              aria-describedby={errors.valor ? `${idBase}-valor-erro` : undefined}
              className="w-full max-w-[9ch] bg-transparent text-center font-display text-[44px] font-bold text-text valor outline-none placeholder:text-muted/50"
              {...valorReg}
              onBlur={(e) => {
                valorReg.onBlur(e)
                const v = parseValor(e.target.value)
                if (v !== null && v > 0) setValue('valor', formatValorCampo(v))
              }}
            />
          </div>
          <MensagemCampo id={`${idBase}-valor-erro`} erro={errors.valor?.message} />
        </div>

        {/* Descrição + sugestões */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${idBase}-descricao`} className={classeRotulo}>
            Descrição
          </label>
          <input
            id={`${idBase}-descricao`}
            autoComplete="off"
            placeholder="Ex.: Mercado do mês"
            aria-invalid={errors.descricao ? true : undefined}
            aria-describedby={errors.descricao ? `${idBase}-descricao-erro` : undefined}
            className={classeCampo}
            {...register('descricao', { onChange: () => setMostrarSugestoes(true) })}
          />
          {mostrarSugestoes && sugestoesFiltradas.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Sugestões">
              {sugestoesFiltradas.map((s) => {
                const cat = categorias?.find((c) => c.id === s.categoria_id)
                return (
                  <button
                    key={s.descricao}
                    type="button"
                    onClick={() => usarSugestao(s)}
                    className="min-h-9 rounded-full border border-border bg-surface px-3 text-[13px] text-text hover:bg-track"
                  >
                    {s.descricao}
                    {cat && <span className="text-muted"> · {cat.nome}</span>}
                  </button>
                )
              })}
            </div>
          )}
          <MensagemCampo id={`${idBase}-descricao-erro`} erro={errors.descricao?.message} />
        </div>

        {/* Categoria */}
        <fieldset className="flex flex-col gap-2">
          <legend className={cn(classeRotulo, 'mb-2')}>Categoria</legend>
          <Controller
            control={control}
            name="categoria_id"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {categoriasDoTipo.map((c) => {
                  const ativo = field.value === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => field.onChange(c.id)}
                      className={cn(
                        'flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 text-xs font-semibold',
                        ativo
                          ? 'border-2 border-primary bg-primary-soft text-primary'
                          : 'border border-border bg-surface text-text hover:bg-track',
                      )}
                    >
                      <IconeLucide nome={c.icone} className="size-5" />
                      <span className="line-clamp-2 text-center">{c.nome}</span>
                    </button>
                  )
                })}
              </div>
            )}
          />
          <MensagemCampo erro={errors.categoria_id?.message} />
        </fieldset>

        {/* Data + mês */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${idBase}-data`} className={classeRotulo}>
              Data
            </label>
            <input
              id={`${idBase}-data`}
              type="date"
              className={classeCampo}
              {...dataReg}
              onChange={(e) => {
                dataReg.onChange(e)
                if (!competenciaManual && e.target.value) {
                  setValue('competencia', competenciaDe(parseISO(e.target.value)), {
                    shouldDirty: true,
                  })
                }
              }}
            />
            <MensagemCampo erro={errors.data?.message} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${idBase}-mes`} className={classeRotulo}>
              Mês
            </label>
            <select
              id={`${idBase}-mes`}
              className={classeCampo}
              {...register('competencia', {
                onChange: () => setCompetenciaManual(true),
              })}
            >
              {opcoesCompetencia.map((c) => (
                <option key={c} value={c}>
                  {formatMes(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Situação */}
        <fieldset className="flex flex-col gap-2">
          <legend className={cn(classeRotulo, 'mb-2')}>Situação</legend>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {opcoesStatus.map((s) => {
                  const ativo = field.value === s
                  const cor =
                    s === 'pago' ? 'border-success text-success' : 'border-warning text-warning'
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => field.onChange(s)}
                      className={cn(
                        'min-h-11 rounded-xl bg-surface text-sm',
                        ativo
                          ? cn('border-2 font-bold', cor)
                          : 'border border-border font-semibold text-text',
                      )}
                    >
                      {nomeStatus(s, tipo)}
                    </button>
                  )
                })}
              </div>
            )}
          />
        </fieldset>

        {modo === 'novo' && tipo === 'saida' && (
          <button
            type="button"
            onClick={irParaParcelas}
            className="-mt-1 flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-primary hover:underline"
          >
            <Layers className="size-4" aria-hidden />É uma compra parcelada? Cadastrar em parcelas
          </button>
        )}

        {status === 'parcial' && (
          <CampoTexto
            id={`${idBase}-valor-pago`}
            rotulo={tipo === 'entrada' ? 'Quanto já recebeu' : 'Quanto já pagou'}
            erro={errors.valor_pago?.message}
          >
            <input
              id={`${idBase}-valor-pago`}
              inputMode="decimal"
              placeholder="0,00"
              autoComplete="off"
              className={classeCampo}
              {...register('valor_pago')}
            />
          </CampoTexto>
        )}

        {status !== 'pago' && (
          <CampoTexto id={`${idBase}-vencimento`} rotulo="Vencimento (opcional)">
            <input
              id={`${idBase}-vencimento`}
              type="date"
              className={classeCampo}
              {...register('vencimento')}
            />
          </CampoTexto>
        )}

        <CampoTexto
          id={`${idBase}-obs`}
          rotulo="Observação (opcional)"
          erro={errors.observacao?.message}
        >
          <textarea
            id={`${idBase}-obs`}
            rows={2}
            className={cn(classeCampo, 'py-3')}
            {...register('observacao')}
          />
        </CampoTexto>

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
          className="mt-1 text-[17px] font-bold"
        >
          {modo === 'editar' ? 'Salvar alterações' : 'Salvar lançamento'}
        </Botao>
      </form>
    </div>
  )
}

function CampoTexto({
  id,
  rotulo,
  erro,
  children,
}: {
  id: string
  rotulo: string
  erro?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={classeRotulo}>
        {rotulo}
      </label>
      {children}
      <MensagemCampo erro={erro} />
    </div>
  )
}
