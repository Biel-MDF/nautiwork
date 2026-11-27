import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { privacyContact } from "@/lib/legal";

export const metadata = { title: "Política de Privacidade — Nautiwork" };

export default function Privacidade() {
  const contato = privacyContact();
  const mail = <a href={`mailto:${contato}`}>{contato}</a>;

  const sections: LegalSection[] = [
    {
      id: "quem-somos", title: "Quem trata os seus dados",
      body: <>
        <p>O Nautiwork é uma plataforma de empregabilidade desenvolvida como Trabalho de Conclusão de Curso do Curso Técnico em Desenvolvimento de Sistemas. O responsável pelo tratamento dos dados (controlador, nos termos da Lei nº 13.709/2018, a LGPD) é o autor do projeto.</p>
        <p>Para qualquer assunto sobre seus dados, inclusive para exercer os direitos descritos abaixo, escreva para {mail} ou abra um pedido na área de Suporte. Esse contato também atua como encarregado (DPO).</p>
      </>,
    },
    {
      id: "dados", title: "Quais dados coletamos",
      body: <>
        <ul>
          <li><strong>Conta:</strong> nome, e-mail, senha (guardada apenas como hash, nunca em texto), tipo de conta e data de aceite destes termos.</li>
          <li><strong>Perfil do candidato:</strong> título profissional, resumo, cidade, área de interesse, modalidade preferida, objetivo, anos de experiência, habilidades, formação, experiências e link do LinkedIn, todos informados por você.</li>
          <li><strong>Contato e localização do candidato (opcionais):</strong> CEP de casa, usado só para estimar o tempo de deslocamento até as vagas (guardamos uma coordenada aproximada do CEP, não o endereço), e número de WhatsApp com a sua autorização para empresas chamarem.</li>
          <li><strong>Provas e projetos do candidato:</strong> resultado das provas de habilidade e os projetos do curso que você cadastrar, com o nome e o e-mail do professor que você indicar para confirmar.</li>
          <li><strong>Acompanhamento depois da contratação:</strong> respostas às perguntas de 30, 60 e 90 dias.</li>
          <li><strong>Perfil da empresa:</strong> nome, descrição, setor, site, cidade, as vagas publicadas e, se informados, CNPJ, razão social, porte e número de funcionários, aprendizes e pessoas com deficiência contratadas.</li>
          <li><strong>Denúncias de vagas</strong> que você fizer, com o motivo.</li>
          <li><strong>Foto ou logotipo,</strong> se você enviar.</li>
          <li><strong>Uso da plataforma:</strong> candidaturas e suas etapas, vagas salvas, notificações e pedidos de suporte com as mensagens trocadas.</li>
          <li><strong>Dados técnicos:</strong> cookie de sessão para manter você conectado e endereço IP, usado apenas de forma temporária para limitar tentativas de login, cadastro e perguntas ao assistente.</li>
        </ul>
        <p>Não pedimos dados sensíveis, como origem racial, religião, saúde ou orientação sexual. Evite incluí-los nos campos de texto livre. Vagas marcadas como exclusivas para pessoas com deficiência não pedem nenhum laudo pelo site: isso fica entre você e a empresa, no processo seletivo.</p>
      </>,
    },
    {
      id: "finalidades", title: "Para que usamos e com qual base legal",
      body: <ul>
        <li><strong>Criar e manter sua conta e conectar candidatos a vagas</strong>, incluindo o cálculo de compatibilidade e o envio da candidatura à empresa escolhida. Base legal: execução de contrato e procedimentos preliminares a pedido do titular (art. 7º, V).</li>
        <li><strong>Enviar e-mails de confirmação, recuperação de senha e respostas do suporte.</strong> Base legal: execução de contrato (art. 7º, V).</li>
        <li><strong>Enviar avisos por e-mail sobre candidaturas e vagas.</strong> Você pode desligar a qualquer momento em Configurações, Notificações.</li>
        <li><strong>Proteger a plataforma contra fraudes e abusos</strong>, como excesso de tentativas de login, vagas que pedem dinheiro e empresas inexistentes (consulta do CNPJ na base pública da Receita Federal). Base legal: legítimo interesse (art. 7º, IX).</li>
        <li><strong>Estimar o tempo de deslocamento</strong> a partir do seu CEP e <strong>mostrar seu WhatsApp</strong> às empresas das suas candidaturas. Base legal: consentimento (art. 7º, I); apague o CEP ou desmarque a autorização no perfil quando quiser.</li>
        <li><strong>Cumprir obrigações legais</strong> e atender pedidos de autoridades. Base legal: art. 7º, II.</li>
      </ul>,
    },
    {
      id: "compartilhamento", title: "Com quem compartilhamos",
      body: <>
        <ul>
          <li><strong>Empresas para as quais você se candidata:</strong> recebem seu nome, e-mail, perfil, foto, a nota de compatibilidade com a vaga, as habilidades comprovadas por prova e os projetos cadastrados (com o nome e o e-mail do professor que confirmou). O WhatsApp só aparece se você autorizou. O CEP e as respostas do acompanhamento de 30, 60 e 90 dias não são mostrados; a empresa só é avisada se você pedir uma conversa. Elas não veem candidaturas feitas para outras empresas.</li>
          <li><strong>Professor indicado por você:</strong> recebe o título e a descrição do projeto para confirmar a autoria.</li>
          <li><strong>Você, sobre as empresas que abriram seu currículo:</strong> quando uma empresa abre o seu currículo completo, registramos qual empresa foi, quantas vezes e em que datas, e mostramos essa lista só para você em Quem viu meu currículo. A empresa não vê essa lista.</li>
          <li><strong>Provedores que operam a plataforma:</strong> hospedagem (Vercel), banco de dados (Neon), envio de e-mails (Resend), monitoramento de erros (Sentry) e consulta de CEP e CNPJ (BrasilAPI e, se ela falhar, OpenStreetMap Nominatim para o CEP; só o número é enviado). O Sentry recebe apenas detalhes técnicos de falhas, sem IP, cookies ou conteúdo de formulários. Eles tratam os dados apenas para prestar o serviço.</li>
          <li><strong>Autoridades públicas,</strong> quando houver obrigação legal ou ordem judicial.</li>
        </ul>
        <p>Não vendemos dados pessoais e não os usamos para publicidade.</p>
        <p>Alguns desses provedores armazenam dados em servidores fora do Brasil, principalmente nos Estados Unidos. Essa transferência internacional segue o art. 33 da LGPD e as garantias contratuais oferecidas por esses provedores.</p>
      </>,
    },
    {
      id: "assistente", title: "Assistente com inteligência artificial",
      body: <>
        <p><strong>No momento o assistente está desligado</strong> e nenhuma conversa é enviada a provedores de IA. As regras abaixo valem quando ele voltar.</p>
        <p>O site tem um assistente de conversa, opcional, que ajuda a buscar vagas e tirar dúvidas. Ele só é usado quando você escreve, e só consulta: não se candidata, não salva, não publica e não altera nada.</p>
        <ul>
          <li><strong>O que é enviado:</strong> sua pergunta, as mensagens anteriores da mesma conversa e os dados que o assistente consulta para responder. Para visitantes, só vagas e empresas públicas. Para candidatos, também o perfil (título, cidade, área, modalidade, anos de experiência e habilidades) e as candidaturas. Para empresas, também as próprias vagas, a contagem de candidaturas e o primeiro nome dos candidatos mais compatíveis. E-mail, foto, telefone e senha nunca são enviados.</li>
          <li><strong>Para quem:</strong> a Vercel AI Gateway, que repassa a conversa ao provedor do modelo de linguagem (Anthropic e, se ele estiver indisponível, OpenAI ou Google). Esses provedores ficam fora do Brasil (art. 33 da LGPD) e tratam os dados apenas para gerar a resposta, conforme seus termos.</li>
          <li><strong>Base legal:</strong> execução do serviço que você pediu (art. 7º, V). O primeiro nome de candidatos mostrado à empresa segue a mesma base do processo seletivo para o qual a pessoa se candidatou.</li>
          <li><strong>Guarda:</strong> o Nautiwork não grava as conversas no banco de dados. Elas ficam só no seu navegador, nesta aba, até você fechá-la ou clicar em Nova conversa. Os provedores podem manter registros técnicos por tempo limitado, segundo as políticas deles.</li>
        </ul>
        <p>As respostas são geradas automaticamente e podem conter erros: confira sempre na página da vaga. O assistente não decide nada sobre candidaturas e não muda a nota de compatibilidade. Não escreva dados sensíveis, documentos ou senhas na conversa.</p>
      </>,
    },
    {
      id: "retencao", title: "Por quanto tempo guardamos",
      body: <>
        <p>Os dados ficam guardados enquanto sua conta existir. Ao excluir a conta, apagamos na hora o perfil, a foto, as candidaturas, as vagas salvas, as provas, os projetos, as respostas de acompanhamento, as denúncias feitas, as notificações e os pedidos de suporte.</p>
        <p>Cópias de segurança mantidas pelo provedor do banco de dados são sobrescritas automaticamente em até 30 dias. Registros técnicos de acesso, quando existirem, são guardados pelo prazo de 6 meses previsto no Marco Civil da Internet (Lei nº 12.965/2014) e depois descartados.</p>
      </>,
    },
    {
      id: "direitos", title: "Seus direitos",
      body: <>
        <p>A LGPD (art. 18) garante a você, a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos seus dados e acessá-los;</li>
          <li>corrigir dados incompletos ou desatualizados;</li>
          <li>pedir a eliminação dos dados e a portabilidade para outro serviço;</li>
          <li>saber com quem compartilhamos;</li>
          <li>revogar o consentimento, como o de receber avisos por e-mail;</li>
          <li>pedir revisão de decisões tomadas apenas por tratamento automatizado (art. 20).</li>
        </ul>
        <p>Boa parte disso você faz sozinho em <strong>Configurações, Privacidade</strong>: baixar uma cópia dos seus dados e excluir a conta. Para o resto, escreva para {mail}. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
        <p>Sobre decisões automatizadas: a nota de compatibilidade é apenas uma indicação. Ela não elimina candidatos, e a decisão sobre cada candidatura é sempre de uma pessoa da empresa.</p>
      </>,
    },
    {
      id: "seguranca", title: "Como protegemos os dados",
      body: <ul>
        <li>Senhas guardadas com hash bcrypt e links de e-mail de uso único, com validade curta.</li>
        <li>Conexões sempre criptografadas (HTTPS).</li>
        <li>Cada pessoa só acessa os próprios dados, e a permissão é conferida no servidor a cada ação.</li>
        <li>Trocar a senha encerra todas as sessões abertas.</li>
      </ul>,
    },
    {
      id: "mudancas", title: "Mudanças nesta política",
      body: <p>Se esta política mudar de forma relevante, avisaremos no site e por e-mail antes de a mudança valer. A data e a versão no topo da página mostram a edição em vigor.</p>,
    },
  ];

  return <LegalPage title="Política de Privacidade" sections={sections} other={{ href: "/termos", label: "Ler os Termos de Uso" }}
    intro={<p>Explicamos aqui, em linguagem direta, quais dados o Nautiwork coleta, para que servem, com quem são compartilhados e como você controla tudo isso.</p>} />;
}
