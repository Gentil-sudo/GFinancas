import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Marca } from '@/components/layout/Marca'
import { useAuth } from '@/features/auth/authContext'
import { CONTATO_EMAIL, VERSAO_TERMOS } from './termos'

/** Política de privacidade e termos de uso (pública: dá para ler antes de criar conta). */
export function PrivacidadePage() {
  const { session } = useAuth()
  const voltar = session
    ? { to: '/configuracoes', rotulo: 'Configurações' }
    : { to: '/cadastro', rotulo: 'Criar conta' }
  const [ano, mes, dia] = VERSAO_TERMOS.split('-')
  const contato = CONTATO_EMAIL ? (
    <>
      pelo e-mail{' '}
      <a href={`mailto:${CONTATO_EMAIL}`} className="font-semibold text-primary hover:underline">
        {CONTATO_EMAIL}
      </a>
    </>
  ) : (
    'diretamente com quem te convidou para usar o app'
  )

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 md:py-12">
      <Marca className="text-lg" />
      <Link
        to={voltar.to}
        className="-ml-1 flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-primary"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {voltar.rotulo}
      </Link>

      <header>
        <h1 className="text-[26px] font-bold tracking-tight">Privacidade e termos de uso</h1>
        <p className="mt-1 text-sm text-muted">
          Atualizado em {dia}/{mes}/{ano}
        </p>
      </header>

      <div className="rounded-card border border-border bg-surface p-5 text-[15px] leading-relaxed">
        <p className="font-semibold">Em resumo</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Guardamos só o que você digita no app, para mostrar de volta a você.</li>
          <li>Não vendemos, não compartilhamos e não usamos seus dados para anúncios.</li>
          <li>Não conectamos à sua conta do banco e não pedimos CPF.</li>
          <li>Você pode baixar tudo ou excluir sua conta a qualquer momento, pelo próprio app.</li>
        </ul>
      </div>

      <Secao titulo="1. O que é guardado">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Conta:</strong> seu e-mail e sua senha. A senha é guardada de forma
            criptografada e ninguém consegue lê-la, nem o responsável pelo app.
          </li>
          <li>
            <strong>Perfil:</strong> o nome que você escolher (opcional) e o tema de cores.
          </li>
          <li>
            <strong>Suas finanças:</strong> lançamentos, parcelas, metas, investimentos e categorias
            que você cadastrar.
          </li>
          <li>
            <strong>Histórico de alterações:</strong> um registro de cada mudança, para você poder
            conferir e recuperar o que foi alterado ou apagado.
          </li>
          <li>
            <strong>No seu aparelho:</strong> a sessão (para não pedir login toda hora), o tema e a
            data do último backup.
          </li>
        </ul>
        <p>
          Não usamos ferramentas de estatística, rastreamento ou anúncios. Não pedimos documentos
          nem acesso à sua conta bancária.
        </p>
      </Secao>

      <Secao titulo="2. Para que é usado">
        <p>
          Só para o app funcionar: mostrar seus números, calcular resumos e gráficos e enviar
          e-mails da sua conta (confirmação de cadastro e recuperação de senha). Mais nada.
        </p>
      </Secao>

      <Secao titulo="3. Onde fica e quem pode ver">
        <p>
          Os dados ficam no <strong>Supabase</strong> (banco de dados na nuvem) e o app é servido
          pela <strong>Vercel</strong>. As fontes do texto vêm do <strong>Google Fonts</strong>, que
          recebe o endereço de internet do seu aparelho ao baixá-las. Esses serviços podem ter
          servidores fora do Brasil.
        </p>
        <p>
          A conexão é sempre criptografada. O banco tem regras que fazem cada pessoa ver só os
          próprios dados: outros usuários nunca enxergam os seus.
        </p>
        <p>
          Quem mantém o app tem acesso administrativo ao banco, necessário para mantê-lo
          funcionando, e se compromete a não consultar seus dados, exceto quando você pedir ajuda ou
          para corrigir uma falha, e a nunca repassá-los a ninguém.
        </p>
      </Secao>

      <Secao titulo="4. Seus direitos (LGPD)">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Ver e levar seus dados:</strong> em Configurações → Backup você baixa tudo em
            planilha (Excel) ou arquivo JSON.
          </li>
          <li>
            <strong>Corrigir:</strong> qualquer informação pode ser editada no app.
          </li>
          <li>
            <strong>Apagar:</strong> em Configurações → Excluir minha conta, todos os seus dados e a
            conta são apagados na hora, para sempre.
          </li>
          <li>
            <strong>Tirar dúvidas:</strong> fale {contato}.
          </li>
        </ul>
      </Secao>

      <Secao titulo="5. Termos de uso">
        <ul className="list-disc space-y-1 pl-5">
          <li>O app é gratuito e oferecido como está, para organização financeira pessoal.</li>
          <li>
            Ele não é consultoria financeira. Os cálculos podem ter erros: confira valores
            importantes antes de tomar decisões.
          </li>
          <li>
            Faça backups de vez em quando. Tomamos cuidado para não perder nada, mas não há garantia
            contra falhas dos serviços usados.
          </li>
          <li>
            Use só com os seus dados. Não cadastre informações de outras pessoas sem permissão.
          </li>
          <li>Contas usadas para abuso ou ataque ao serviço podem ser bloqueadas.</li>
          <li>
            Se o app for encerrado ou mudar de forma importante, você será avisado com pelo menos 30
            dias de antecedência, para poder baixar seus dados.
          </li>
        </ul>
      </Secao>

      <Secao titulo="6. Mudanças neste texto">
        <p>
          Se este texto mudar, a data no topo é atualizada e as mudanças importantes são avisadas no
          app.
        </p>
      </Secao>
    </div>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 text-[15px] leading-relaxed">
      <h2 className="text-lg font-bold">{titulo}</h2>
      {children}
    </section>
  )
}
