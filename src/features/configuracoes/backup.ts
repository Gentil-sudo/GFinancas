import { differenceInCalendarDays, format } from 'date-fns'
import { supabase } from '@/lib/supabase'

/** Tabelas no backup, na ordem segura para importar (quem é referenciado vem antes). */
export const TABELAS_BACKUP = [
  'categorias',
  'metas',
  'compras_parceladas',
  'lancamentos',
  'meta_movimentos',
  'investimentos',
  'perfis',
] as const
type TabelaBackup = (typeof TABELAS_BACKUP)[number]
type Linha = Record<string, unknown>

export const NOMES_TABELAS: Record<TabelaBackup | 'historico', string> = {
  categorias: 'Categorias',
  metas: 'Metas',
  compras_parceladas: 'Compras parceladas',
  lancamentos: 'Lançamentos',
  meta_movimentos: 'Aportes e retiradas',
  investimentos: 'Investimentos',
  perfis: 'Perfil',
  historico: 'Histórico',
}

export interface Backup {
  app: 'minhas-financas'
  versao: 1
  gerado_em: string
  tabelas: Record<TabelaBackup, Linha[]> & { historico?: Linha[] }
}

const POR_PAGINA = 1000

/** Lê uma tabela inteira (o Supabase devolve no máximo 1000 linhas por vez). */
async function lerTudo(tabela: TabelaBackup | 'historico'): Promise<Linha[]> {
  const todas: Linha[] = []
  for (let de = 0; ; de += POR_PAGINA) {
    const { data, error } = await supabase
      .from(tabela)
      .select('*')
      .order(tabela === 'perfis' ? 'user_id' : 'id')
      .range(de, de + POR_PAGINA - 1)
    if (error) throw error
    todas.push(...(data as Linha[]))
    if (data.length < POR_PAGINA) return todas
  }
}

/** Junta todos os dados do usuário (inclusive lixeira e histórico). */
export async function gerarBackup(): Promise<Backup> {
  const tabelas = {} as Backup['tabelas']
  for (const t of TABELAS_BACKUP) tabelas[t] = await lerTudo(t)
  tabelas.historico = await lerTudo('historico')
  return { app: 'minhas-financas', versao: 1, gerado_em: new Date().toISOString(), tabelas }
}

function nomeArquivo(ext: string) {
  return `minhas-financas-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.${ext}`
}

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function baixarJson(backup: Backup) {
  baixar(
    new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
    nomeArquivo('json'),
  )
  registrarBackupFeito()
}

/** Uma aba por tabela; números como número (dá para somar no Excel). */
export async function baixarXlsx(backup: Backup) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const blob = await writeXlsxFile(montarAbas(backup)).toBlob()
  baixar(blob, nomeArquivo('xlsx'))
  registrarBackupFeito()
}

/** Converte o backup nas abas da planilha (função pura: testável fora do navegador). */
export function montarAbas(backup: Backup) {
  const nomes = [...TABELAS_BACKUP, 'historico'] as const
  return nomes.map((t) => {
    const linhas = backup.tabelas[t] ?? []
    const colunas = linhas.length > 0 ? Object.keys(linhas[0]) : ['(vazio)']
    const cabecalho = colunas.map((c) => ({ value: c, fontWeight: 'bold' as const }))
    const dados = linhas.map((l) =>
      colunas.map((c) => {
        const v = l[c]
        if (v === null || v === undefined) return null
        if (typeof v === 'number' || typeof v === 'boolean') return v
        if (typeof v === 'object') return JSON.stringify(v)
        return String(v)
      }),
    )
    return {
      sheet: NOMES_TABELAS[t],
      data: [cabecalho, ...dados],
      columns: colunas.map((c) => ({ width: Math.min(40, Math.max(10, c.length + 4)) })),
    }
  })
}

// ---------- Lembrete "Último backup: há X dias" (guardado neste navegador)

const CHAVE_BACKUP = 'ultimo-backup'

function registrarBackupFeito() {
  try {
    localStorage.setItem(CHAVE_BACKUP, new Date().toISOString())
  } catch {
    // ignora
  }
}

/** Dias desde o último backup feito neste aparelho; `null` se nunca. */
export function diasDesdeBackup(): number | null {
  try {
    const v = localStorage.getItem(CHAVE_BACKUP)
    return v ? differenceInCalendarDays(new Date(), new Date(v)) : null
  } catch {
    return null
  }
}

export function textoUltimoBackup(dias: number | null): string {
  if (dias === null) return 'Nenhum backup feito neste aparelho.'
  if (dias === 0) return 'Último backup: hoje.'
  if (dias === 1) return 'Último backup: ontem.'
  return `Último backup: há ${dias} dias.`
}

// ---------- Importar (restaurar)

/** Confere se o arquivo é um backup deste app. Lança erro com mensagem em português. */
export function validarBackup(conteudo: unknown): Backup {
  const b = conteudo as Partial<Backup> | null
  if (!b || b.app !== 'minhas-financas' || !b.tabelas || typeof b.tabelas !== 'object') {
    throw new Error('Este arquivo não é um backup do Minhas Finanças (.json).')
  }
  if (b.versao !== 1) throw new Error('Versão de backup não suportada.')
  for (const t of TABELAS_BACKUP) {
    if (!Array.isArray(b.tabelas[t]))
      throw new Error(`Backup incompleto: falta "${NOMES_TABELAS[t]}".`)
  }
  return b as Backup
}

export type ProgressoImportacao = (tabela: string, feitas: number, total: number) => void

/**
 * Restaura um backup na conta logada (inserindo ou atualizando pelo id).
 * - Troca o dono das linhas pelo usuário atual (permite restaurar em outra conta).
 * - Categoria com mesmo nome/tipo já existente: reaproveita a existente (sem duplicar).
 * - O histórico não é importado (só o banco escreve nele).
 */
export async function importarBackup(
  backup: Backup,
  userId: string,
  progresso?: ProgressoImportacao,
): Promise<Record<string, number>> {
  const contagem: Record<string, number> = {}

  // Categorias: mapeia para as existentes com mesmo nome+tipo.
  const { data: existentes, error } = await supabase.from('categorias').select('id, nome, tipo')
  if (error) throw error
  const porNome = new Map(existentes.map((c) => [`${c.tipo}|${c.nome}`, c.id]))
  const idsExistentes = new Set(existentes.map((c) => c.id))
  const trocaCategoria = new Map<string, string>()
  const categoriasNovas = backup.tabelas.categorias.filter((c) => {
    const id = String(c.id)
    const igual = porNome.get(`${c.tipo}|${c.nome}`)
    if (igual && igual !== id && !idsExistentes.has(id)) {
      trocaCategoria.set(id, igual)
      return false
    }
    return true
  })

  for (const tabela of TABELAS_BACKUP) {
    const origem = tabela === 'categorias' ? categoriasNovas : backup.tabelas[tabela]
    const linhas = origem.map((l) => {
      const n: Linha = { ...l, user_id: userId }
      delete n.valor_brl // coluna calculada pelo banco
      if (typeof n.categoria_id === 'string' && trocaCategoria.has(n.categoria_id)) {
        n.categoria_id = trocaCategoria.get(n.categoria_id)
      }
      return n
    })
    for (let i = 0; i < linhas.length; i += 500) {
      const lote = linhas.slice(i, i + 500)
      const { error: e } = await supabase
        .from(tabela)
        .upsert(lote as never, { onConflict: tabela === 'perfis' ? 'user_id' : 'id' })
      if (e) throw e
      progresso?.(NOMES_TABELAS[tabela], Math.min(i + 500, linhas.length), linhas.length)
    }
    contagem[NOMES_TABELAS[tabela]] = linhas.length
  }
  return contagem
}
