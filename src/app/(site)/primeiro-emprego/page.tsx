import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Checklist } from "@/components/differentials";

export const metadata: Metadata = {
  title: "Guia do primeiro emprego — Nautiwork",
  description: "Documentos, direitos do Jovem Aprendiz e do estagiário, entrevista e como reconhecer golpe de vaga: o passo a passo para quem vai trabalhar pela primeira vez.",
  alternates: { canonical: "/primeiro-emprego" },
};

const DOCS = [
  { key: "cpf", label: "CPF", hint: "Se ainda não tem, a inscrição é gratuita pela internet.", href: "https://www.gov.br/pt-br/servicos/inscrever-no-cpf" },
  { key: "govbr", label: "Conta gov.br", hint: "Serve para entrar na Carteira de Trabalho Digital e em outros serviços do governo.", href: "https://www.gov.br/pt-br/servicos/criar-sua-conta-gov.br" },
  { key: "ctps", label: "Carteira de Trabalho Digital", hint: "Hoje ela é digital e o número é o próprio CPF. Baixe o aplicativo e entre com a conta gov.br.", href: "https://www.gov.br/pt-br/servicos/obter-a-carteira-de-trabalho" },
  { key: "rg", label: "Documento com foto e comprovante de residência", hint: "RG ou CNH e uma conta recente no seu nome ou de quem mora com você." },
  { key: "escola", label: "Declaração de matrícula ou histórico escolar", hint: "Pedida em vagas de estágio e de Jovem Aprendiz. Peça na secretaria da escola." },
  { key: "banco", label: "Conta para receber", hint: "Muitas empresas abrem uma conta-salário para você. Nunca pague para abrir conta a pedido de recrutador." },
];

const READY = [
  { key: "perfil", label: "Perfil completo no Nautiwork", hint: "Área de interesse, cidade e habilidades melhoram a compatibilidade com as vagas.", href: "/candidate/profile" },
  { key: "projeto", label: "Um projeto do curso cadastrado e confirmado pelo professor", hint: "Sem experiência, é o que mostra o que você já fez.", href: "/candidate/resume" },
  { key: "prova", label: "Uma prova de habilidade feita", hint: "Quem passa ganha o selo de habilidade comprovada.", href: "/candidate/provas" },
  { key: "entrevista", label: "Respostas ensaiadas para a entrevista", hint: "Fale de você em 1 minuto, de um projeto que fez e de por que quer aquela vaga. Leia sobre a empresa antes." },
  { key: "trajeto", label: "Trajeto até a vaga testado", hint: "Com o CEP no perfil, o Nautiwork mostra o tempo estimado de casa até cada vaga." },
];

export default function FirstJobPage() {
  return (
    <>
      <PageHeader title="Guia do primeiro emprego" description="O que separar, quais são seus direitos e como fugir de golpe. Marque o que já fez: o progresso fica salvo neste aparelho." />
      <main className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <section aria-labelledby="docs"><h2 id="docs" className="font-display text-xl font-semibold">1. Documentos</h2>
          <div className="mt-3"><Checklist id="docs" items={DOCS} /></div></section>

        <section aria-labelledby="ready"><h2 id="ready" className="font-display text-xl font-semibold">2. Antes de se candidatar</h2>
          <div className="mt-3"><Checklist id="ready" items={READY} /></div></section>

        <section aria-labelledby="direitos" className="space-y-4"><h2 id="direitos" className="font-display text-xl font-semibold">3. Seus direitos</h2>
          <article className="card text-sm leading-relaxed">
            <h3 className="font-semibold">Jovem Aprendiz (Lei 10.097/2000 e CLT)</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-abyss/85">
              <li>Para quem tem de 14 a 24 anos. Para pessoas com deficiência não há idade máxima.</li>
              <li>Carteira assinada, com contrato de aprendizagem por escrito, de até 2 anos.</li>
              <li>Salário com base no salário mínimo por hora, vale-transporte e FGTS (2%).</li>
              <li>Até 6 horas por dia; até 8 horas para quem já terminou o ensino fundamental, contando as aulas teóricas. Sem hora extra e sem banco de horas.</li>
              <li>Quem não terminou o ensino médio precisa continuar estudando.</li>
            </ul>
          </article>
          <article className="card text-sm leading-relaxed">
            <h3 className="font-semibold">Estágio (Lei 11.788/2008)</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-abyss/85">
              <li>Termo de compromisso assinado por você, pela escola e pela empresa, com um supervisor na empresa.</li>
              <li>Até 6 horas por dia e 30 por semana para ensino médio, técnico e superior.</li>
              <li>No estágio não obrigatório, bolsa e auxílio-transporte são obrigatórios.</li>
              <li>Seguro contra acidentes pessoais pago pela empresa.</li>
              <li>Recesso de 30 dias a cada ano de estágio (proporcional se for menos), remunerado quando há bolsa.</li>
              <li>Até 2 anos na mesma empresa, exceto para pessoas com deficiência.</li>
            </ul>
          </article>
          <p className="text-xs text-abyss/60">Resumo informativo, não substitui orientação jurídica. Textos completos: <a className="text-tide hover:underline" href="https://www.planalto.gov.br/ccivil_03/leis/l10097.htm" target="_blank" rel="noopener noreferrer">Lei 10.097/2000</a> e <a className="text-tide hover:underline" href="https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11788.htm" target="_blank" rel="noopener noreferrer">Lei 11.788/2008</a>.</p>
        </section>

        <section id="golpes" aria-labelledby="golpes-t" className="scroll-mt-24 space-y-3"><h2 id="golpes-t" className="font-display text-xl font-semibold">4. Como reconhecer golpe de vaga</h2>
          <div className="card text-sm leading-relaxed">
            <p className="font-semibold">Processo seletivo de verdade não cobra nada. Desconfie quando pedirem:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-abyss/85">
              <li>Pix, taxa de cadastro, de material, de uniforme ou de exame.</li>
              <li>Compra de curso ou kit para ser contratado.</li>
              <li>Senha de banco, número de cartão ou código que chegou por SMS.</li>
              <li>Conversa só por WhatsApp ou Telegram, com pressa e sem entrevista.</li>
              <li>Salário muito acima do normal para pouca exigência (&quot;renda extra garantida&quot;).</li>
            </ul>
            <p className="mt-3 text-abyss/85">No Nautiwork, vagas que pedem dinheiro são recusadas na publicação e vagas com sinais suspeitos passam pela moderação antes de ir ao ar. Viu algo estranho? Use o botão &quot;Denunciar vaga&quot; na página da vaga: com três denúncias, ela sai do ar até a revisão.</p>
          </div>
        </section>

        <div className="flex flex-wrap gap-2"><Link href="/jobs?aprendiz=1" className="btn-primary">Ver vagas de Jovem Aprendiz</Link><Link href="/jobs?contractType=INTERNSHIP" className="btn-ghost">Ver vagas de estágio</Link></div>
      </main>
    </>
  );
}
