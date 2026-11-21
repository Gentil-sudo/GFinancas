import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'

export interface OpcoesAcao<T> {
  /** Texto do toast de sucesso (pode depender do resultado). */
  sucesso: string | ((resultado: T) => string)
  /** Se informado, o toast ganha o botão "Desfazer". */
  desfazer?: (resultado: T) => Promise<unknown>
}

/** Recarrega os dados financeiros (lançamentos, resumo, compras, metas...). */
export function invalidarDados(qc: QueryClient) {
  return qc.invalidateQueries({
    predicate: (q) => q.queryKey[0] !== 'perfil' && q.queryKey[0] !== 'categorias',
  })
}

/** Erros do banco com mensagem já pensada para o usuário (raise exception nas funções SQL). */
function mensagemDoServidor(e: unknown): string | null {
  const erro = e as { code?: string; message?: string } | null
  if (erro?.code === '23505') return 'já existe um item com esse nome.'
  if (erro?.message && (erro.code === '22023' || erro.code === 'P0002')) return erro.message
  return null
}

/**
 * Executa uma gravação seguindo o PLANO §5:
 *  - recusa se estiver offline (nada de "fingir que salvou");
 *  - "Salvo ✓" só DEPOIS da confirmação do servidor, com "Desfazer" quando possível;
 *  - em erro: "Não foi salvo — tentar de novo", e devolve `undefined` (quem chamou mantém
 *    o formulário preenchido).
 */
export function useExecutarAcao() {
  const qc = useQueryClient()

  return useCallback(
    async function tentar<T>(
      acao: () => Promise<T>,
      opcoes: OpcoesAcao<T>,
    ): Promise<T | undefined> {
      if (!navigator.onLine) {
        toast.error('Sem internet: nada foi salvo. Tente quando a conexão voltar.')
        return undefined
      }
      try {
        const resultado = await acao()
        await invalidarDados(qc)
        const texto =
          typeof opcoes.sucesso === 'function' ? opcoes.sucesso(resultado) : opcoes.sucesso
        const desfazer = opcoes.desfazer
        toast.success(
          texto,
          desfazer && {
            action: {
              label: 'Desfazer',
              onClick: () => {
                desfazer(resultado)
                  .then(() => invalidarDados(qc))
                  .then(() => toast.success('Desfeito ✓'))
                  .catch((e) => {
                    console.error(e)
                    toast.error('Não foi possível desfazer. Tente de novo.')
                  })
              },
            },
          },
        )
        return resultado
      } catch (e) {
        console.error('[acao]', e)
        const msg = mensagemDoServidor(e)
        toast.error(msg ? `Não foi salvo: ${msg}` : 'Não foi salvo — tentar de novo', {
          action: msg
            ? undefined
            : { label: 'Tentar de novo', onClick: () => void tentar(acao, opcoes) },
        })
        return undefined
      }
    },
    [qc],
  )
}
