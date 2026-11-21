import { Download, FileJson, FileSpreadsheet, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { Card, TituloCard } from '@/components/ui/Card'
import { useAuth } from '@/features/auth/authContext'
import { useQueryClient } from '@tanstack/react-query'
import { invalidarDados } from '@/lib/useExecutarAcao'
import { useOnline } from '@/lib/online'
import {
  baixarJson,
  baixarXlsx,
  diasDesdeBackup,
  textoUltimoBackup,
  gerarBackup,
  importarBackup,
  NOMES_TABELAS,
  TABELAS_BACKUP,
  validarBackup,
  type Backup,
} from './backup'
import { SubPagina } from './SubPagina'

export function BackupPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const online = useOnline()
  const [gerando, setGerando] = useState<'xlsx' | 'json' | null>(null)
  const [dias, setDias] = useState(diasDesdeBackup)
  const [arquivo, setArquivo] = useState<Backup | null>(null)
  const [erroArquivo, setErroArquivo] = useState<string | null>(null)
  const [importando, setImportando] = useState<string | null>(null)
  const entrada = useRef<HTMLInputElement>(null)

  async function exportar(formato: 'xlsx' | 'json') {
    setGerando(formato)
    try {
      const backup = await gerarBackup()
      if (formato === 'xlsx') await baixarXlsx(backup)
      else baixarJson(backup)
      setDias(diasDesdeBackup())
      toast.success('Backup baixado ✓ Guarde o arquivo num lugar seguro (ex.: Google Drive).')
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível gerar o backup. Verifique a internet e tente de novo.')
    } finally {
      setGerando(null)
    }
  }

  async function escolherArquivo(f: File | undefined) {
    setArquivo(null)
    setErroArquivo(null)
    if (!f) return
    try {
      setArquivo(validarBackup(JSON.parse(await f.text())))
    } catch (e) {
      setErroArquivo(
        e instanceof SyntaxError ? 'O arquivo não é um JSON válido.' : (e as Error).message,
      )
    } finally {
      if (entrada.current) entrada.current.value = ''
    }
  }

  async function restaurar() {
    if (!arquivo || !user) return
    setImportando('Começando…')
    try {
      const contagem = await importarBackup(arquivo, user.id, (t, feitas, total) =>
        setImportando(`${t}: ${feitas} de ${total}`),
      )
      await invalidarDados(qc)
      await qc.invalidateQueries({ queryKey: ['categorias'] })
      toast.success(
        `Backup restaurado ✓ ${Object.values(contagem).reduce((a, b) => a + b, 0)} itens.`,
      )
      setArquivo(null)
    } catch (e) {
      console.error(e)
      toast.error(
        'A restauração parou no meio. Pode rodar de novo com o mesmo arquivo: nada é duplicado.',
      )
    } finally {
      setImportando(null)
    }
  }

  return (
    <SubPagina titulo="Backup">
      <Card>
        <TituloCard>Exportar</TituloCard>
        <p className="text-sm text-muted">
          Baixa tudo: lançamentos, parcelas, metas, investimentos, categorias, lixeira e histórico.
        </p>
        <Aviso tipo={dias === null || dias > 30 ? 'atencao' : 'info'}>
          {textoUltimoBackup(dias)}
        </Aviso>
        <div className="grid gap-2 sm:grid-cols-2">
          <Botao
            carregando={gerando === 'xlsx'}
            disabled={!online || gerando !== null}
            onClick={() => exportar('xlsx')}
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            Baixar Excel (.xlsx)
          </Botao>
          <Botao
            variante="secundario"
            carregando={gerando === 'json'}
            disabled={!online || gerando !== null}
            onClick={() => exportar('json')}
          >
            <FileJson className="size-4" aria-hidden />
            Baixar .json (para restaurar)
          </Botao>
        </div>
      </Card>

      <Card>
        <TituloCard>Restaurar de um backup</TituloCard>
        <p className="text-sm text-muted">
          Use um arquivo <strong>.json</strong> baixado aqui. Itens que já existem são atualizados
          com a versão do arquivo; nada é duplicado.
        </p>
        <input
          ref={entrada}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          id="arquivo-backup"
          onChange={(e) => escolherArquivo(e.target.files?.[0])}
        />
        <label
          htmlFor="arquivo-backup"
          className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 text-sm font-semibold text-primary hover:bg-bg"
        >
          <Upload className="size-4" aria-hidden />
          Escolher arquivo .json
        </label>
        {erroArquivo && <Aviso tipo="erro">{erroArquivo}</Aviso>}
        {arquivo && (
          <div className="flex flex-col gap-3 rounded-2xl bg-bg p-4 text-sm">
            <p>
              Backup de <strong>{new Date(arquivo.gerado_em).toLocaleString('pt-BR')}</strong>:
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted">
              {TABELAS_BACKUP.map((t) => (
                <li key={t}>
                  {NOMES_TABELAS[t]}:{' '}
                  <span className="font-semibold text-text valor">{arquivo.tabelas[t].length}</span>
                </li>
              ))}
            </ul>
            <Aviso tipo="atencao">
              Os itens do arquivo substituem as versões atuais com o mesmo id. O que você criou
              depois do backup continua.
            </Aviso>
            <Botao carregando={importando !== null} disabled={!online} onClick={restaurar}>
              <Download className="size-4" aria-hidden />
              {importando ?? 'Restaurar este backup'}
            </Botao>
          </div>
        )}
      </Card>
    </SubPagina>
  )
}
