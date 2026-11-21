import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { CampoSenha } from '@/components/ui/Campo'
import { Folha } from '@/components/ui/Folha'
import { traduzirErroAuth } from '@/features/auth/erros'
import { novaSenhaSchema, type NovaSenhaDados } from '@/features/auth/schemas'
import { useOnline } from '@/lib/online'
import { supabase } from '@/lib/supabase'

/** Folha "Trocar senha" (o usuário já está logado). */
export function TrocarSenha({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  return (
    <Folha aberta={aberta} onFechar={onFechar} titulo="Trocar senha">
      <Conteudo onFechar={onFechar} />
    </Folha>
  )
}

function Conteudo({ onFechar }: { onFechar: () => void }) {
  const online = useOnline()
  const [erro, setErro] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NovaSenhaDados>({ resolver: zodResolver(novaSenhaSchema) })

  async function salvar(d: NovaSenhaDados) {
    setErro(null)
    const { error } = await supabase.auth.updateUser({ password: d.senha })
    if (error) return setErro(traduzirErroAuth(error))
    toast.success('Senha alterada ✓')
    onFechar()
  }

  return (
    <form onSubmit={handleSubmit(salvar)} noValidate className="flex flex-col gap-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <CampoSenha
        label="Nova senha"
        autoComplete="new-password"
        autoFocus
        dica="Pelo menos 8 caracteres."
        erro={errors.senha?.message}
        {...register('senha')}
      />
      <CampoSenha
        label="Confirme a nova senha"
        autoComplete="new-password"
        erro={errors.confirmacao?.message}
        {...register('confirmacao')}
      />
      <Botao type="submit" larguraTotal carregando={isSubmitting} disabled={!online}>
        Salvar nova senha
      </Botao>
    </form>
  )
}
