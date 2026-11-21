import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { CampoSenha } from '@/components/ui/Campo'
import { TelaCarregando } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { useAuth } from './authContext'
import { AuthLayout } from './AuthLayout'
import { traduzirErroAuth } from './erros'
import { novaSenhaSchema, type NovaSenhaDados } from './schemas'

/**
 * Destino do link de "esqueci minha senha". Ao abrir o link, o Supabase já cria uma sessão
 * temporária; aqui o usuário só escolhe a nova senha.
 */
export function RedefinirSenhaPage() {
  const { session, carregando } = useAuth()
  const navigate = useNavigate()
  const [erroServidor, setErroServidor] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NovaSenhaDados>({ resolver: zodResolver(novaSenhaSchema) })

  async function salvar(dados: NovaSenhaDados) {
    setErroServidor(null)
    const { error } = await supabase.auth.updateUser({ password: dados.senha })
    if (error) {
      setErroServidor(traduzirErroAuth(error))
      return
    }
    toast.success('Senha alterada ✓')
    navigate('/', { replace: true })
  }

  if (carregando) return <TelaCarregando />

  if (!session) {
    return (
      <AuthLayout
        titulo="Link inválido ou expirado"
        rodape={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        }
      >
        <Aviso tipo="atencao">
          Este link de recuperação não vale mais (ele expira e só pode ser usado uma vez).
        </Aviso>
        <Botao larguraTotal className="mt-4" onClick={() => navigate('/esqueci-senha')}>
          Pedir um novo link
        </Botao>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout titulo="Nova senha" subtitulo={`Conta: ${session.user.email ?? ''}`}>
      <form onSubmit={handleSubmit(salvar)} noValidate className="flex flex-col gap-4">
        {erroServidor && <Aviso tipo="erro">{erroServidor}</Aviso>}

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

        <Botao type="submit" carregando={isSubmitting} larguraTotal>
          Salvar nova senha
        </Botao>
      </form>
    </AuthLayout>
  )
}
