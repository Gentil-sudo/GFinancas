import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Botao } from '@/components/ui/Botao'
import { CampoValorGrande } from '@/components/ui/CampoValorGrande'
import { classeCampo, classeRotulo } from '@/components/ui/estilos'
import { Folha } from '@/components/ui/Folha'
import { Segmentado } from '@/components/ui/Segmentado'
import { competencia, formatMes, formatValorCampo, parseValor, somarMeses } from '@/lib/format'
import { useOnline } from '@/lib/online'
import type { Meta, TipoMovimentoMeta } from '@/types/db'
import { useAcoesMeta } from './api'

const schema = z
  .object({
    tipo: z.enum(['aporte', 'retirada']),
    valor: z.string(),
    descricao: z.string().max(120, 'Use no máximo 120 caracteres.'),
    competencia: z.string().min(1),
  })
  .superRefine((d, ctx) => {
    const v = parseValor(d.valor)
    if (v === null || v <= 0) {
      ctx.addIssue({ code: 'custom', path: ['valor'], message: 'Informe um valor maior que zero.' })
    }
  })
type Dados = z.infer<typeof schema>

/** Folha para registrar um aporte ou uma retirada numa meta. */
export function FormMovimento({
  meta,
  tipoInicial,
  onFechar,
}: {
  meta: Meta | null
  tipoInicial: TipoMovimentoMeta
  onFechar: () => void
}) {
  return (
    <Folha aberta={Boolean(meta)} onFechar={onFechar} titulo={meta?.nome ?? ''}>
      {meta && (
        <Conteudo
          key={`${meta.id}-${tipoInicial}`}
          meta={meta}
          tipoInicial={tipoInicial}
          onFechar={onFechar}
        />
      )}
    </Folha>
  )
}

function Conteudo({
  meta,
  tipoInicial,
  onFechar,
}: {
  meta: Meta
  tipoInicial: TipoMovimentoMeta
  onFechar: () => void
}) {
  const id = useId()
  const online = useOnline()
  const { registrarMovimento } = useAcoesMeta()
  const atual = competencia()
  const opcoesMes = useMemo(
    () => Array.from({ length: 25 }, (_, i) => somarMeses(atual, i - 18)),
    [atual],
  )

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Dados>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: tipoInicial, valor: '', descricao: '', competencia: atual },
  })

  async function salvar(d: Dados) {
    const ok = await registrarMovimento({
      meta_id: meta.id,
      tipo: d.tipo,
      valor: parseValor(d.valor)!,
      competencia: d.competencia,
      descricao: d.descricao.trim() || null,
    })
    if (ok) onFechar()
  }

  return (
    <form onSubmit={handleSubmit(salvar)} noValidate className="flex flex-col gap-4">
      <Controller
        control={control}
        name="tipo"
        render={({ field }) => (
          <Segmentado
            rotulo="Tipo"
            valor={field.value}
            onChange={field.onChange}
            opcoes={[
              { valor: 'aporte', rotulo: '+ Aporte' },
              { valor: 'retirada', rotulo: '− Retirada' },
            ]}
          />
        )}
      />
      <CampoValorGrande
        rotulo="Valor"
        erro={errors.valor?.message}
        registro={register('valor')}
        autoFocus
        aoSair={(t) => {
          const v = parseValor(t)
          if (v !== null && v > 0) setValue('valor', formatValorCampo(v))
        }}
      />
      {meta.aporte_mensal_planejado && (
        <button
          type="button"
          onClick={() => setValue('valor', formatValorCampo(Number(meta.aporte_mensal_planejado)))}
          className="-mt-2 self-center text-sm font-semibold text-primary hover:underline"
        >
          Usar o valor planejado ({formatValorCampo(Number(meta.aporte_mensal_planejado))})
        </button>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-desc`} className={classeRotulo}>
          Descrição (opcional)
        </label>
        <input
          id={`${id}-desc`}
          placeholder="Ex.: Sinal do buffet"
          className={classeCampo}
          {...register('descricao')}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-mes`} className={classeRotulo}>
          Mês
        </label>
        <select id={`${id}-mes`} className={classeCampo} {...register('competencia')}>
          {opcoesMes.map((m) => (
            <option key={m} value={m}>
              {formatMes(m)}
            </option>
          ))}
        </select>
      </div>
      <Botao
        type="submit"
        tamanho="grande"
        larguraTotal
        carregando={isSubmitting}
        disabled={!online}
      >
        Salvar
      </Botao>
    </form>
  )
}
