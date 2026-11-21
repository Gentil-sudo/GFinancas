import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { Campo, CampoSenha, MensagemCampo } from '@/components/ui/Campo'
import { VERSAO_TERMOS } from '@/features/legal/termos'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from './AuthLayout'
import { Captcha } from './Captcha'
import { MSG_EMAIL_JA_CADASTRADO, traduzirErroAuth } from './erros'
import { cadastroSchema, type CadastroDados } from './schemas'
import { useCaptcha } from './useCaptcha'

export function CadastroPage() {
  const [erroServidor, setErroServidor] = useState<string | null>(null)
  const [emailConfirmacao, setEmailConfirmacao] = useState<string | null>(null)
  const captcha = useCaptcha()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastroDados>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { aceite: false },
  })

  async function cadastrar(dados: CadastroDados) {
    setErroServidor(null)
    const { data, error } = await supabase.auth.signUp({
      email: dados.email,
      password: dados.senha,
      options: {
        emailRedirectTo: window.location.origin,
        captchaToken: captcha.token,
        // Registro do aceite (fica nos dados da conta, no Supabase).
        data: { termos_versao: VERSAO_TERMOS, termos_aceitos_em: new Date().toISOString() },
      },
    })
    captcha.resetar() // o token só vale uma vez

    if (error) {
      setErroServidor(traduzirErroAuth(error))
      return
    }
    // Com confirmação de e-mail ligada, o Supabase não dá erro para e-mail repetido:
    // devolve um usuário sem identidades.
    if (data.user && data.user.identities?.length === 0) {
      setErroServidor(MSG_EMAIL_JA_CADASTRADO)
      return
    }
    // Sem sessão = precisa confirmar o e-mail. Com sessão, a RotaDeslogado já redireciona.
    if (!data.session) setEmailConfirmacao(dados.email)
  }

  if (emailConfirmacao) {
    return (
      <AuthLayout
        titulo="Confirme seu e-mail"
        rodape={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Voltar para o login
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center">
          <span className="mb-3 grid size-12 place-items-center rounded-full bg-success/10 text-success">
            <MailCheck className="size-6" aria-hidden />
          </span>
          <p className="text-sm text-muted">
            Conta criada! Enviamos um link para <strong>{emailConfirmacao}</strong>. Abra o e-mail e
            clique no link para entrar.
          </p>
          <p className="mt-3 text-sm text-muted">Não chegou? Veja a caixa de spam.</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      titulo="Criar conta"
      subtitulo="Seus dados ficam salvos com segurança na nuvem."
      rodape={
        <p>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(cadastrar)} noValidate className="flex flex-col gap-4">
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
        <CampoSenha
          label="Senha"
          autoComplete="new-password"
          dica="Pelo menos 8 caracteres."
          erro={errors.senha?.message}
          {...register('senha')}
        />
        <CampoSenha
          label="Confirme a senha"
          autoComplete="new-password"
          erro={errors.confirmacao?.message}
          {...register('confirmacao')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-5 shrink-0 accent-primary"
              aria-invalid={errors.aceite ? true : undefined}
              aria-describedby={errors.aceite ? 'aceite-erro' : undefined}
              {...register('aceite')}
            />
            <span>
              Li e aceito a{' '}
              <Link
                to="/privacidade"
                target="_blank"
                className="font-semibold text-primary hover:underline"
              >
                política de privacidade e os termos de uso
              </Link>
              .
            </span>
          </label>
          <MensagemCampo id="aceite-erro" erro={errors.aceite?.message} />
        </div>

        <Captcha {...captcha.props} />

        <Botao type="submit" carregando={isSubmitting} disabled={!captcha.pronto} larguraTotal>
          Criar conta
        </Botao>
      </form>
    </AuthLayout>
  )
}
