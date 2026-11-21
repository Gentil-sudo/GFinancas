import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { Campo } from '@/components/ui/Campo'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from './AuthLayout'
import { Captcha } from './Captcha'
import { traduzirErroAuth } from './erros'
import { esqueciSenhaSchema, type EsqueciSenhaDados } from './schemas'
import { useCaptcha } from './useCaptcha'

export function EsqueciSenhaPage() {
  const [erroServidor, setErroServidor] = useState<string | null>(null)
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null)
  const captcha = useCaptcha()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaDados>({ resolver: zodResolver(esqueciSenhaSchema) })

  async function enviar(dados: EsqueciSenhaDados) {
    setErroServidor(null)
    const { error } = await supabase.auth.resetPasswordForEmail(dados.email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
      captchaToken: captcha.token,
    })
    captcha.resetar() // o token só vale uma vez
    if (error) setErroServidor(traduzirErroAuth(error))
    else setEnviadoPara(dados.email)
  }

  return (
    <AuthLayout
      titulo="Esqueci minha senha"
      subtitulo={enviadoPara ? undefined : 'Enviaremos um link para você criar uma nova senha.'}
      rodape={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {enviadoPara ? (
        <Aviso tipo="sucesso">
          Se existir uma conta com <strong>{enviadoPara}</strong>, você vai receber um e-mail com o
          link em instantes. Veja também a caixa de spam.
        </Aviso>
      ) : (
        <form onSubmit={handleSubmit(enviar)} noValidate className="flex flex-col gap-4">
          {erroServidor && <Aviso tipo="erro">{erroServidor}</Aviso>}

          <Campo
            label="E-mail"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoFocus
            erro={errors.email?.message}
            {...register('email')}
          />

          <Captcha {...captcha.props} />

          <Botao type="submit" carregando={isSubmitting} disabled={!captcha.pronto} larguraTotal>
            Enviar link
          </Botao>
        </form>
      )}
    </AuthLayout>
  )
}
