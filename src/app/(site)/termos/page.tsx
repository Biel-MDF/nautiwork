import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { privacyContact } from "@/lib/legal";

export const metadata = { title: "Termos de Uso — Nautiwork" };

export default function Termos() {
  const contato = privacyContact();

  const sections: LegalSection[] = [
    {
      id: "aceite", title: "Aceite",
      body: <p>Ao criar uma conta, você declara que leu e aceita estes Termos e a <Link href="/privacidade">Política de Privacidade</Link>. Se não concordar, não use a plataforma. É preciso ter pelo menos 16 anos; menores de 18 anos devem ter autorização de um responsável, inclusive para vagas de estágio e aprendiz.</p>,
    },
    {
      id: "servico", title: "O que é o Nautiwork",
      body: <>
        <p>O Nautiwork aproxima pessoas que procuram trabalho de empresas com vagas abertas. A plataforma não é agência de emprego, não participa da contratação e não garante entrevista, contratação ou qualquer resultado.</p>
        <p>É um projeto acadêmico (TCC). Pode ter instabilidades, mudanças sem aviso prévio e dados de demonstração, que são sempre marcados com [Demo].</p>
      </>,
    },
    {
      id: "conta", title: "Sua conta",
      body: <ul>
        <li>As informações do cadastro e do perfil precisam ser verdadeiras e suas.</li>
        <li>A senha é pessoal. Você responde pelo que for feito com a sua conta até nos avisar de um uso indevido.</li>
        <li>Cada pessoa ou empresa deve ter uma única conta.</li>
      </ul>,
    },
    {
      id: "candidatos", title: "Regras para candidatos",
      body: <ul>
        <li>Candidate-se apenas a vagas que realmente interessam e para as quais as informações do seu perfil são verdadeiras.</li>
        <li>Ao se candidatar, você autoriza que a empresa da vaga veja seu perfil, sua foto e seu e-mail.</li>
        <li>Você pode retirar uma candidatura a qualquer momento, enquanto ela estiver em andamento.</li>
      </ul>,
    },
    {
      id: "empresas", title: "Regras para empresas",
      body: <>
        <p>A empresa declara que existe, que tem autorização para recrutar em seu nome e que as vagas publicadas são reais. É proibido:</p>
        <ul>
          <li>cobrar qualquer valor de candidatos, como taxa de inscrição, curso obrigatório, material ou exame;</li>
          <li>publicar vaga falsa, pirâmide financeira, venda disfarçada de vaga ou oportunidade ilegal;</li>
          <li>discriminar por raça, cor, sexo, idade, religião, deficiência, orientação sexual, origem ou estado civil, salvo em ações afirmativas permitidas por lei;</li>
          <li>usar os dados dos candidatos para outra finalidade que não seja aquele processo seletivo, ou repassá-los a terceiros.</li>
        </ul>
        <p>Ao receber dados de candidatos, a empresa passa a ser também controladora desses dados e responde pelo seu uso conforme a LGPD.</p>
      </>,
    },
    {
      id: "proibido", title: "Condutas proibidas para todos",
      body: <ul>
        <li>Enviar conteúdo ofensivo, discriminatório, enganoso ou que viole direitos de outras pessoas.</li>
        <li>Tentar acessar dados ou áreas de outros usuários, burlar limites de segurança ou sobrecarregar o sistema.</li>
        <li>Coletar dados da plataforma de forma automatizada (robôs, raspagem).</li>
        <li>Usar o assistente para fins alheios à plataforma, tentar contornar suas regras ou fazer perguntas em volume para sobrecarregá-lo.</li>
      </ul>,
    },
    {
      id: "assistente", title: "Assistente com inteligência artificial",
      body: <p>O assistente de conversa é um recurso de apoio, oferecido sem garantia de disponibilidade. As respostas são geradas automaticamente e podem ter erros; as informações que valem são as das páginas de cada vaga e do seu painel. Há um limite de perguntas por período. Como os dados da conversa são tratados está na Política de Privacidade.</p>,
    },
    {
      id: "moderacao", title: "Moderação e suspensão",
      body: <p>A equipe pode remover vagas e conteúdos, ou suspender contas, que violem estes Termos ou coloquem outras pessoas em risco, inclusive sem aviso prévio em casos graves. Quem discordar da decisão pode pedir revisão pelo Suporte.</p>,
    },
    {
      id: "encerramento", title: "Encerramento da conta",
      body: <p>Você pode excluir sua conta quando quiser, em Configurações, Privacidade. A exclusão apaga seus dados como descrito na <Link href="/privacidade">Política de Privacidade</Link>. Se uma empresa excluir a conta, suas vagas são encerradas e os candidatos recebem um aviso.</p>,
    },
    {
      id: "responsabilidade", title: "Limites de responsabilidade",
      body: <p>As informações das vagas são de responsabilidade das empresas que as publicam, e as dos perfis, de cada candidato. O Nautiwork não responde por acordos feitos fora da plataforma nem por prejuízos decorrentes de informações falsas inseridas por usuários. Desconfie de qualquer pedido de pagamento e denuncie pelo Suporte.</p>,
    },
    {
      id: "geral", title: "Disposições gerais",
      body: <p>Estes Termos seguem a lei brasileira. Mudanças relevantes serão avisadas no site e por e-mail antes de valer. Dúvidas: <a href={`mailto:${contato}`}>{contato}</a>.</p>,
    },
  ];

  return <LegalPage title="Termos de Uso" sections={sections} other={{ href: "/privacidade", label: "Ler a Política de Privacidade" }}
    intro={<p>As regras para usar o Nautiwork, escritas para serem lidas: o que a plataforma faz, o que se espera de candidatos e empresas e o que acontece quando alguém descumpre.</p>} />;
}
