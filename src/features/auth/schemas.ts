import { z } from 'zod'

const email = z.string().trim().min(1, 'Informe seu e-mail.').pipe(z.email('E-mail inválido.'))

const novaSenha = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.')

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, 'Informe sua senha.'),
})
export type LoginDados = z.infer<typeof loginSchema>

export const cadastroSchema = z
  .object({ email, senha: novaSenha, confirmacao: z.string() })
  .refine((d) => d.senha === d.confirmacao, {
    message: 'As senhas não conferem.',
    path: ['confirmacao'],
  })
export type CadastroDados = z.infer<typeof cadastroSchema>

export const esqueciSenhaSchema = z.object({ email })
export type EsqueciSenhaDados = z.infer<typeof esqueciSenhaSchema>

export const novaSenhaSchema = z
  .object({ senha: novaSenha, confirmacao: z.string() })
  .refine((d) => d.senha === d.confirmacao, {
    message: 'As senhas não conferem.',
    path: ['confirmacao'],
  })
export type NovaSenhaDados = z.infer<typeof novaSenhaSchema>
