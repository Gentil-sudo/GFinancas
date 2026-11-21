import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js'

const mensagens: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed:
    'Seu e-mail ainda não foi confirmado. Abra o link que enviamos (veja também o spam).',
  user_already_exists: 'Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.',
  email_exists: 'Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.',
  weak_password: 'Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  over_email_send_rate_limit:
    'Limite de e-mails atingido. Aguarde alguns minutos antes de pedir outro link.',
  over_request_rate_limit: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.',
  signup_disabled: 'O cadastro de novas contas está desativado.',
  email_address_invalid: 'Este e-mail não é válido.',
  email_address_not_authorized: 'Este e-mail não tem permissão para receber mensagens.',
  user_banned: 'Esta conta está bloqueada.',
  session_not_found: 'Sua sessão expirou. Entre novamente.',
  session_expired: 'Sua sessão expirou. Entre novamente.',
  refresh_token_not_found: 'Sua sessão expirou. Entre novamente.',
  otp_expired: 'O link expirou ou já foi usado. Peça um novo.',
  flow_state_expired: 'O link expirou. Peça um novo.',
  request_timeout: 'O servidor demorou para responder. Tente de novo.',
  captcha_failed:
    'Não foi possível confirmar que você não é um robô. Aguarde a verificação e tente de novo.',
}

export const MSG_EMAIL_JA_CADASTRADO = mensagens.user_already_exists

/** Converte qualquer erro de autenticação do Supabase em uma mensagem em português. */
export function traduzirErroAuth(erro: unknown): string {
  if (isAuthRetryableFetchError(erro) || (erro instanceof TypeError && !navigator.onLine)) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'
  }
  if (isAuthError(erro) && erro.code && mensagens[erro.code]) {
    return mensagens[erro.code]
  }
  console.error('[auth] erro não mapeado:', erro)
  return 'Algo deu errado. Tente de novo em instantes.'
}
