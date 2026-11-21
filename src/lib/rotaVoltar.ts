/**
 * Lê o parâmetro `?voltar=` com segurança: só aceita caminhos internos do app
 * ("/configuracao-inicial?passo=2"), nunca outro site ("//site.com", "https://...").
 */
export function rotaVoltar(params: URLSearchParams, padrao: string): string {
  const v = params.get('voltar')
  if (v && v.startsWith('/') && !v.startsWith('//') && !v.includes('\\')) return v
  return padrao
}
