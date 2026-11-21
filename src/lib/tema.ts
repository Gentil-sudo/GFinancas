import type { Tema } from '@/types/db'

/** O que o usuário escolhe (inclui "automático"). */
export type TemaEscolha = Tema
/** O que de fato é aplicado na tela. */
export type TemaAplicado = Exclude<Tema, 'automatico'>

export const TEMA_PADRAO: TemaEscolha = 'clareza'
const CHAVE_LOCAL = 'tema'

/**
 * Fontes de cada tema (só a do tema ativo é baixada).
 * ATENÇÃO: o script inline do index.html repete esta tabela para aplicar o tema antes do
 * React carregar (evita a tela "piscar"). Mudou aqui, mude lá também.
 */
const FONTES: Record<TemaAplicado, string> = {
  clareza:
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap',
  noite: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap',
  lavanda:
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
}

/** Cor da barra do navegador no celular (= fundo do tema). */
const COR_BARRA: Record<TemaAplicado, string> = {
  clareza: '#F4F6FA',
  noite: '#0D1117',
  lavanda: '#F7F5FC',
}

const midiaEscura = () => window.matchMedia('(prefers-color-scheme: dark)')

export function resolverTema(escolha: TemaEscolha): TemaAplicado {
  if (escolha === 'automatico') return midiaEscura().matches ? 'noite' : 'clareza'
  return escolha
}

export function aplicarTema(escolha: TemaEscolha): TemaAplicado {
  const tema = resolverTema(escolha)
  document.documentElement.dataset.theme = tema

  let link = document.getElementById('fonte-tema') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = 'fonte-tema'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  if (link.href !== FONTES[tema]) link.href = FONTES[tema]

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_BARRA[tema])
  return tema
}

export function lerTemaLocal(): TemaEscolha {
  try {
    const t = localStorage.getItem(CHAVE_LOCAL)
    if (t === 'automatico' || t === 'clareza' || t === 'noite' || t === 'lavanda') return t
  } catch {
    // localStorage indisponível (modo privado etc.)
  }
  return TEMA_PADRAO
}

export function salvarTemaLocal(escolha: TemaEscolha) {
  try {
    localStorage.setItem(CHAVE_LOCAL, escolha)
  } catch {
    // ignora
  }
}

/** Avisa quando o sistema troca entre claro/escuro (usado no modo "automático"). */
export function observarModoDoSistema(callback: () => void): () => void {
  const m = midiaEscura()
  m.addEventListener('change', callback)
  return () => m.removeEventListener('change', callback)
}

export const OPCOES_TEMA: Array<{ valor: TemaEscolha; nome: string; descricao: string }> = [
  { valor: 'clareza', nome: 'Clareza', descricao: 'Claro, azul (padrão)' },
  { valor: 'noite', nome: 'Noite', descricao: 'Escuro, verde-água' },
  { valor: 'lavanda', nome: 'Lavanda', descricao: 'Claro, roxo' },
  { valor: 'automatico', nome: 'Automático', descricao: 'Clareza ou Noite, conforme o sistema' },
]
