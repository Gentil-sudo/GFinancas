import { zodResolver } from '@hookform/resolvers/zod'
import { FileQuestion, WifiOff, X } from 'lucide-react'
import { useId, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useParams, useSearchParams } from 'react-router'
import { z } from 'zod'
import { Botao } from '@/components/ui/Botao'
import { CampoRotulado as Campo } from '@/components/ui/Campo'
import { CampoValorGrande } from '@/components/ui/CampoValorGrande'
import { EstadoVazio } from '@/components/ui/EstadoVazio'
import { classeCampo } from '@/components/ui/estilos'
import { GradeCategorias } from '@/components/ui/GradeCategorias'
import { Segmentado } from '@/components/ui/Segmentado'
import { TelaCarregando } from '@/components/ui/Spinner'
import { useCategorias } from '@/features/categorias/api'
import { useMetas } from '@/features/metas/api'
import { cn } from '@/lib/cn'
import {
  competencia,
  formatBRL,
  formatMes,
  formatMesCurto,
  formatValorCampo,
  parseValor,
  somarMeses,
} from '@/lib/format'
import { useOnline } from '@/lib/online'
import { rotaVoltar } from '@/lib/rotaVoltar'
import { useSaidaFormulario } from '@/lib/useSaidaFormulario'
import { useAcoesCompra, useComprasParceladas } from './api'
import type { ResumoCompra } from './calculos'

const inteiro = (s: string) => (/^\d+$/.test(s.trim()) ? Number(s.trim()) : NaN)

const schema = z
  .object({
    descricao: z
      .string()
      .trim()
      .min(1, 'Descreva a compra (ex.: "Sofá").')
      .max(100, 'Use no máximo 100 caracteres.'),
    valor: z.string(),
    total: z.string(),
    situacao: z.enum(['nova', 'andamento']),
    mes: z.string().min(1),
    parcelaAtual: z.string(),
    dia: z.string(),
    categoria_id: z.string().min(1, 'Escolha uma categoria.'),
    meta_id: z.string(),
    observacao: z.string().max(500, 'Use no máximo 500 caracteres.'),
    incluirPagas: z.boolean(),
  })
  .superRefine((d, ctx) => {
    const v = parseValor(d.valor)
    if (v === null || v <= 0) {
      ctx.addIssue({ code: 'custom', path: ['valor'], message: 'Informe o valor da parcela.' })
    }
    const n = inteiro(d.total)
    if (!Number.isInteger(n) || n < 1 || n > 480) {
      ctx.addIssue({ code: 'custom', path: ['total'], message: 'Entre 1 e 480 parcelas.' })
    }
    if (d.situacao === 'andamento') {
      const a = inteiro(d.parcelaAtual)
      if (!Number.isInteger(a) || a < 2 || (Number.isInteger(n) && a > n)) {
        ctx.addIssue({
          code: 'custom',
          path: ['parcelaAtual'],
          message: Number.isInteger(n) ? `Entre 2 e ${n}.` : 'Informe a parcela atual.',
        })
      }
    }
    if (d.dia.trim()) {
      const dia = inteiro(d.dia)
      if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
        ctx.addIssue({ code: 'custom', path: ['dia'], message: 'Dia entre 1 e 31.' })
      }
    }
  })

type FormDados = z.infer<typeof schema>

export function FormCompraPage({ modo }: { modo: 'nova' | 'editar' }) {
  const { id } = useParams()
  const { resumos, isLoading } = useComprasParceladas()
  const original = modo === 'editar' ? resumos.find((r) => r.compra.id === id) : undefined

  if (modo === 'editar') {
    if (isLoading) return <TelaCarregando />
    if (!original) {
      return (
        <div className="mx-auto max-w-lg px-5 pt-10">
          <EstadoVazio
            icone={FileQuestion}
            titulo="Compra não encontrada"
            texto="Ela pode ter sido cancelada ou o link está errado."
          />
        </div>
      )
    }
  }
  return <Formulario key={original?.compra.id ?? 'nova'} original={original ?? null} />
}

function valoresIniciais(original: ResumoCompra | null, params: URLSearchParams): FormDados {
  if (original) {
    const c = original.compra
    return {
      descricao: c.descricao,
      valor: formatValorCampo(Number(c.valor_parcela)),
      total: String(c.total_parcelas),
      situacao: 'nova',
      mes: c.primeira_competencia,
      parcelaAtual: '',
      dia: c.dia_vencimento ? String(c.dia_vencimento) : '',
      categoria_id: c.categoria_id ?? '',
      meta_id: c.meta_id ?? '',
      observacao: c.observacao ?? '',
      incluirPagas: false,
    }
  }
  const valor = parseValor(params.get('valor') ?? '')
  return {
    descricao: params.get('descricao') ?? '',
    valor: valor ? formatValorCampo(valor) : '',
    total: '',
    situacao: params.get('andamento') ? 'andamento' : 'nova',
    mes: competencia(),
    parcelaAtual: '',
    dia: '',
    categoria_id: params.get('categoria') ?? '',
    meta_id: '',
    observacao: '',
    incluirPagas: false,
  }
}

function Formulario({ original }: { original: ResumoCompra | null }) {
  const editando = Boolean(original)
  const [params] = useSearchParams()
  const online = useOnline()
  const idBase = useId()
  const { criar, atualizar } = useAcoesCompra()
  const { data: categorias } = useCategorias()
  const { data: metas } = useMetas()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormDados>({
    resolver: zodResolver(schema),
    defaultValues: valoresIniciais(original, params),
  })
  const destino = rotaVoltar(params, '/parcelas')
  const { concluir, fechar } = useSaidaFormulario(isDirty, destino)

  const [situacao, valor, total, mes, parcelaAtual] = useWatch({
    control,
    name: ['situacao', 'valor', 'total', 'mes', 'parcelaAtual'],
  })

  const categoriaOriginal = original?.compra.categoria_id
  const categoriasSaida = (categorias ?? []).filter(
    (c) => c.tipo === 'saida' && (!c.arquivada || c.id === categoriaOriginal),
  )
  const metasAtivas = (metas ?? []).filter((m) => !m.arquivada)

  const opcoesMes = useMemo(() => {
    const base = competencia()
    return Array.from({ length: 49 }, (_, i) => somarMeses(base, i - 36))
  }, [])

  // Resumo do que vai acontecer ("1ª parcela em ago/2026 · última em jun/2027 · total R$ ...")
  const n = inteiro(total)
  const v = parseValor(valor)
  const atualN = situacao === 'andamento' ? inteiro(parcelaAtual) : 1
  const primeira =
    editando || situacao === 'nova'
      ? mes
      : Number.isInteger(atualN)
        ? somarMeses(mes, -(atualN - 1))
        : null
  const previa =
    Number.isInteger(n) && n > 0 && v && primeira && Number.isInteger(atualN)
      ? {
          primeira,
          ultima: somarMeses(primeira, n - 1),
          total: v * n,
          criadas: n - atualN + 1,
        }
      : null

  async function salvar(f: FormDados) {
    const comum = {
      p_descricao: f.descricao.trim(),
      p_valor_parcela: parseValor(f.valor)!,
      p_total_parcelas: inteiro(f.total),
      p_dia_vencimento: f.dia.trim() ? inteiro(f.dia) : null,
      p_categoria_id: f.categoria_id,
      p_meta_id: f.meta_id || null,
      p_observacao: f.observacao.trim() || null,
    }
    if (original) {
      const ok = await atualizar({
        ...comum,
        p_compra_id: original.compra.id,
        p_incluir_pagas: f.incluirPagas,
      })
      if (ok) concluir()
      return
    }
    const parcela = f.situacao === 'andamento' ? inteiro(f.parcelaAtual) : 1
    const id = await criar({
      ...comum,
      p_primeira_competencia: somarMeses(f.mes, -(parcela - 1)),
      p_parcela_atual: parcela,
    })
    if (id) concluir(destino)
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-[18px] px-5 pt-6 pb-12">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-bold tracking-tight">
          {editando ? 'Editar compra' : 'Nova compra parcelada'}
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
        <CampoValorGrande
          rotulo="Valor da parcela"
          erro={errors.valor?.message}
          registro={register('valor')}
          autoFocus={!editando && !params.get('valor')}
          aoSair={(t) => {
            const p = parseValor(t)
            if (p !== null && p > 0) setValue('valor', formatValorCampo(p))
          }}
        />

        <Campo rotulo="Descrição" id={`${idBase}-desc`} erro={errors.descricao?.message}>
          <input
            id={`${idBase}-desc`}
            autoComplete="off"
            placeholder="Ex.: Sofá"
            className={classeCampo}
            aria-invalid={errors.descricao ? true : undefined}
            {...register('descricao')}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Nº de parcelas" id={`${idBase}-total`} erro={errors.total?.message}>
            <input
              id={`${idBase}-total`}
              inputMode="numeric"
              placeholder="12"
              className={classeCampo}
              aria-invalid={errors.total ? true : undefined}
              {...register('total')}
            />
          </Campo>
          <Campo
            rotulo="Dia do vencimento"
            id={`${idBase}-dia`}
            erro={errors.dia?.message}
            dica="Opcional"
          >
            <input
              id={`${idBase}-dia`}
              inputMode="numeric"
              placeholder="10"
              className={classeCampo}
              aria-invalid={errors.dia ? true : undefined}
              {...register('dia')}
            />
          </Campo>
        </div>

        {editando ? (
          <p className="rounded-2xl bg-bg px-4 py-3 text-sm text-muted">
            1ª parcela em <strong className="text-text">{formatMes(mes)}</strong>. Para mudar o mês,
            cancele a compra e cadastre de novo.
          </p>
        ) : (
          <>
            <Controller
              control={control}
              name="situacao"
              render={({ field }) => (
                <Segmentado
                  rotulo="Situação da compra"
                  valor={field.value}
                  onChange={field.onChange}
                  opcoes={[
                    { valor: 'nova', rotulo: 'Compra nova' },
                    { valor: 'andamento', rotulo: 'Já estou pagando' },
                  ]}
                />
              )}
            />
            <div className={cn('grid gap-3', situacao === 'andamento' && 'grid-cols-2')}>
              {situacao === 'andamento' && (
                <Campo
                  rotulo="Parcela deste mês"
                  id={`${idBase}-atual`}
                  erro={errors.parcelaAtual?.message}
                >
                  <input
                    id={`${idBase}-atual`}
                    inputMode="numeric"
                    placeholder="4"
                    className={classeCampo}
                    aria-invalid={errors.parcelaAtual ? true : undefined}
                    {...register('parcelaAtual')}
                  />
                </Campo>
              )}
              <Campo
                rotulo={situacao === 'andamento' ? 'Mês dessa parcela' : 'Mês da 1ª parcela'}
                id={`${idBase}-mes`}
              >
                <select id={`${idBase}-mes`} className={classeCampo} {...register('mes')}>
                  {opcoesMes.map((m) => (
                    <option key={m} value={m}>
                      {formatMes(m)}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
          </>
        )}

        {previa && (
          <p className="rounded-2xl bg-primary-soft px-4 py-3 text-sm text-text" aria-live="polite">
            1ª parcela em {formatMesCurto(previa.primeira)} · última em{' '}
            {formatMesCurto(previa.ultima)} · total{' '}
            <strong className="valor">{formatBRL(previa.total)}</strong>
            {!editando && situacao === 'andamento' && (
              <>
                <br />
                Serão criadas as parcelas {atualN} a {n} ({previa.criadas}); as anteriores contam
                como pagas.
              </>
            )}
          </p>
        )}

        <Controller
          control={control}
          name="categoria_id"
          render={({ field }) => (
            <GradeCategorias
              categorias={categoriasSaida}
              valor={field.value}
              onChange={field.onChange}
              erro={errors.categoria_id?.message}
            />
          )}
        />

        {metasAtivas.length > 0 && (
          <Campo rotulo="Ligar a uma meta (opcional)" id={`${idBase}-meta`}>
            <select id={`${idBase}-meta`} className={classeCampo} {...register('meta_id')}>
              <option value="">Nenhuma</option>
              {metasAtivas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Campo>
        )}

        <Campo
          rotulo="Observação (opcional)"
          id={`${idBase}-obs`}
          erro={errors.observacao?.message}
        >
          <textarea
            id={`${idBase}-obs`}
            rows={2}
            className={cn(classeCampo, 'py-3')}
            {...register('observacao')}
          />
        </Campo>

        {editando && (
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]"
              {...register('incluirPagas')}
            />
            <span>
              Aplicar também nas parcelas <strong>já pagas</strong>
              <span className="block text-muted">
                Desmarcado: muda só as parcelas que ainda não foram pagas.
              </span>
            </span>
          </label>
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
          {editando ? 'Salvar alterações' : 'Salvar compra'}
        </Botao>
      </form>
    </div>
  )
}
