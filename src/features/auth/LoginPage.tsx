import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Aviso } from '@/components/ui/Aviso'
import { Botao } from '@/components/ui/Botao'
import { Campo, CampoSenha } from '@/components/ui/Campo'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from './AuthLayout'
import { traduzirErroAuth } from './erros'
import { loginSchema, type LoginDados } from './schemas'

export function LoginPage() {
  const [erroServidor, setErroServidor] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginDados>({ resolver: zodResolver(loginSchema) })

  async function entrar(dados: LoginDados) {
    setErroServidor(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: dados.email,
      password: dados.senha,
    })
    if (error) setErroServidor(traduzirErroAuth(error))
    // Sucesso: a sessão chega pelo AuthProvider e a RotaDeslogado redireciona sozinha.
  }

  return (
    <AuthLayout
      titulo="Entrar"
      subtitulo="Acesse suas finanças."
      rodape={
        <p>
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-marca hover:underline">
            Criar conta
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(entrar)} noValidate className="flex flex-col gap-4">
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
          autoComplete="current-password"
          erro={errors.senha?.message}
          {...register('senha')}
        />

        <Link
          to="/esqueci-senha"
          className="-mt-1 self-end text-sm font-medium text-marca hover:underline"
        >
          Esqueci minha senha
        </Link>

        <Botao type="submit" carregando={isSubmitting} larguraTotal>
          Entrar
        </Botao>
      </form>
    </AuthLayout>
  )
}
