import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { Campo } from '@/components/ui/Campo'
import { Folha } from '@/components/ui/Folha'
import { useOnline } from '@/lib/online'
import { supabase } from '@/lib/supabase'

const PALAVRA = 'EXCLUIR'

/** Folha "Excluir minha conta": apaga tudo para sempre (LGPD: direito de eliminação). */
export function ExcluirConta({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  return (
    <Folha aberta={aberta} onFechar={onFechar} titulo="Excluir minha conta">
      <Conteudo />
    </Folha>
  )
}

function Conteudo() {
  const online = useOnline()
  const [texto, setTexto] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const confirmado = texto.trim().toUpperCase() === PALAVRA

  async function excluir(e: FormEvent) {
    e.preventDefault()
    if (!confirmado) return
    setErro(null)
    setExcluindo(true)
    const { error } = await supabase.rpc('excluir_minha_conta')
    if (error) {
      console.error('[conta] falha ao excluir:', error)
      setErro('Não foi possível excluir a conta. Nada foi apagado. Tente de novo.')
      setExcluindo(false)
      return
    }
    try {
      localStorage.removeItem('ultimo-backup')
    } catch {
      // ignora
    }
    // A conta já não existe no servidor: só limpa a sessão deste aparelho.
    await supabase.auth.signOut({ scope: 'local' })
    toast.success('Sua conta e todos os seus dados foram excluídos.')
  }

  return (
    <form onSubmit={excluir} className="flex flex-col gap-4">
      <Aviso tipo="atencao">
        Isto apaga para sempre todos os seus lançamentos, parcelas, metas, investimentos, categorias
        e o histórico, além da sua conta. Não dá para desfazer.
      </Aviso>
      <p className="text-sm text-muted">
        Quer guardar uma cópia antes?{' '}
        <Link to="/configuracoes/backup" className="font-semibold text-primary hover:underline">
          Baixe um backup
        </Link>
        .
      </p>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Campo
        label={`Para confirmar, digite ${PALAVRA}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
      />
      <Botao
        type="submit"
        variante="perigo"
        larguraTotal
        carregando={excluindo}
        disabled={!online || !confirmado}
      >
        Excluir conta e todos os dados
      </Botao>
      {!online && <p className="text-sm text-muted">Sem internet: conecte-se para excluir.</p>}
    </form>
  )
}
