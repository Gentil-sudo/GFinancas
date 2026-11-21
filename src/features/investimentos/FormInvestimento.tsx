import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Botao } from '@/components/ui/Botao'
import { CampoRotulado } from '@/components/ui/Campo'
import { CampoValorGrande } from '@/components/ui/CampoValorGrande'
import { classeCampo, classeRotulo } from '@/components/ui/estilos'
import { Folha } from '@/components/ui/Folha'
import { Segmentado } from '@/components/ui/Segmentado'
import { cn } from '@/lib/cn'
import {
  formatBRL,
  formatMes,
  formatValorCampo,
  parseValor,
  round2,
  somarMeses,
} from '@/lib/format'
import { useOnline } from '@/lib/online'
import type { Investimento } from '@/types/db'
import { TIPOS_INVESTIMENTO, useAcoesInvestimento } from './api'

const schema = z
  .object({
    tipo: z.enum(['acoes', 'fundos', 'etf', 'exterior', 'renda_fixa', 'outros']),
    descricao: z.string().max(80, 'Use no máximo 80 caracteres.'),
    moeda: z.enum(['BRL', 'USD']),
    valor: z.string(),
    cotacao: z.string(),
    competencia: z.string().min(1),
  })
  .superRefine((d, ctx) => {
    const v = parseValor(d.valor)
    if (v === null || v < 0) {
      ctx.addIssue({ code: 'custom', path: ['valor'], message: 'Informe o saldo.' })
    }
    if (d.moeda === 'USD') {
      const c = parseValor(d.cotacao)
      if (c === null || c <= 0) {
        ctx.addIssue({ code: 'custom', path: ['cotacao'], message: 'Informe a cotação do dólar.' })
      }
    }
  })
type Dados = z.infer<typeof schema>

/** Folha para adicionar/editar o saldo de um investimento num mês. */
export function FormInvestimento({
  aberta,
  original,
  mes,
  onFechar,
}: {
  aberta: boolean
  /** null = novo. */
  original: Investimento | null
  mes: string
  onFechar: () => void
}) {
  return (
    <Folha
      aberta={aberta}
      onFechar={onFechar}
      titulo={original ? 'Editar saldo' : 'Adicionar saldo'}
      subtitulo="Quanto você tem hoje nesse investimento."
    >
      <Conteudo
        key={original?.id ?? `novo-${mes}`}
        original={original}
        mes={mes}
        onFechar={onFechar}
      />
    </Folha>
  )
}

function Conteudo({
  original,
  mes,
  onFechar,
}: {
  original: Investimento | null
  mes: string
  onFechar: () => void
}) {
  const id = useId()
  const online = useOnline()
  const { criar, editar, excluir } = useAcoesInvestimento()
  const [excluindo, setExcluindo] = useState(false)
  const opcoesMes = useMemo(
    () => Array.from({ length: 25 }, (_, i) => somarMeses(mes, i - 12)),
    [mes],
  )

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Dados>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: original?.tipo ?? 'renda_fixa',
      descricao: original?.descricao ?? '',
      moeda: original?.moeda ?? 'BRL',
      valor: original ? formatValorCampo(Number(original.valor)) : '',
      cotacao: original?.cotacao ? String(original.cotacao).replace('.', ',') : '',
      competencia: original?.competencia ?? mes,
    },
  })
  const [moeda, valor, cotacao] = useWatch({ control, name: ['moeda', 'valor', 'cotacao'] })
  const v = parseValor(valor)
  const c = parseValor(cotacao)
  const emReais = moeda === 'USD' && v !== null && c ? round2(v * c) : null

  async function salvar(d: Dados) {
    const dados = {
      tipo: d.tipo,
      descricao: d.descricao.trim() || null,
      moeda: d.moeda,
      valor: parseValor(d.valor)!,
      cotacao: d.moeda === 'USD' ? parseValor(d.cotacao) : null,
      competencia: d.competencia,
    }
    const ok = original ? await editar(original, dados) : await criar(dados)
    if (ok) onFechar()
  }

  async function remover() {
    if (!original) return
    setExcluindo(true)
    const ok = await excluir(original)
    setExcluindo(false)
    if (ok !== undefined) onFechar()
  }

  return (
    <form onSubmit={handleSubmit(salvar)} noValidate className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className={cn(classeRotulo, 'mb-2')}>Tipo</legend>
        <Controller
          control={control}
          name="tipo"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_INVESTIMENTO.map((t) => {
                const ativo = field.value === t.valor
                return (
                  <button
                    key={t.valor}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => {
                      field.onChange(t.valor)
                      // Exterior quase sempre é em dólar.
                      if (t.valor === 'exterior' && !original) setValue('moeda', 'USD')
                    }}
                    className={cn(
                      'min-h-11 rounded-xl px-1 text-[13px] font-semibold',
                      ativo
                        ? 'border-2 border-primary bg-primary-soft text-primary'
                        : 'border border-border bg-surface text-text hover:bg-track',
                    )}
                  >
                    {t.nome}
                  </button>
                )
              })}
            </div>
          )}
        />
      </fieldset>

      <CampoRotulado
        rotulo="Descrição (opcional)"
        id={`${id}-desc`}
        erro={errors.descricao?.message}
      >
        <input
          id={`${id}-desc`}
          placeholder="Ex.: Tesouro Selic, IVVB11"
          className={classeCampo}
          {...register('descricao')}
        />
      </CampoRotulado>

      <Controller
        control={control}
        name="moeda"
        render={({ field }) => (
          <Segmentado
            rotulo="Moeda"
            valor={field.value}
            onChange={field.onChange}
            opcoes={[
              { valor: 'BRL', rotulo: 'Reais (R$)' },
              { valor: 'USD', rotulo: 'Dólar (US$)' },
            ]}
          />
        )}
      />

      <CampoValorGrande
        rotulo={moeda === 'USD' ? 'Saldo em dólar (US$)' : 'Saldo'}
        erro={errors.valor?.message}
        registro={register('valor')}
        aoSair={(t) => {
          const n = parseValor(t)
          if (n !== null && n >= 0) setValue('valor', formatValorCampo(n))
        }}
      />

      {moeda === 'USD' && (
        <CampoRotulado
          rotulo="Cotação do dólar (R$)"
          id={`${id}-cot`}
          erro={errors.cotacao?.message}
          dica={emReais !== null ? `= ${formatBRL(emReais)}` : 'Ex.: 4,98'}
        >
          <input
            id={`${id}-cot`}
            inputMode="decimal"
            placeholder="4,98"
            className={cn(classeCampo, 'valor')}
            {...register('cotacao')}
          />
        </CampoRotulado>
      )}

      <CampoRotulado rotulo="Mês" id={`${id}-mes`}>
        <select id={`${id}-mes`} className={classeCampo} {...register('competencia')}>
          {opcoesMes.map((m) => (
            <option key={m} value={m}>
              {formatMes(m)}
            </option>
          ))}
        </select>
      </CampoRotulado>

      <Botao
        type="submit"
        tamanho="grande"
        larguraTotal
        carregando={isSubmitting}
        disabled={!online}
      >
        Salvar
      </Botao>
      {original && (
        <Botao
          variante="fantasma"
          className="text-danger"
          carregando={excluindo}
          disabled={!online}
          onClick={remover}
        >
          <Trash2 className="size-4" aria-hidden />
          Excluir (vai para a lixeira)
        </Botao>
      )}
    </form>
  )
}
