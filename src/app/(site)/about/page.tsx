import Link from "next/link";

export const metadata = { title: "Sobre — Nautiwork" };

// Mesmos pesos de src/modules/compatibility.ts
const weights: [string, number, string][] = [
  ["Habilidades", 50, "Quantas das habilidades pedidas estão no seu perfil."],
  ["Área de interesse", 20, "Se a área da vaga é a que você escolheu."],
  ["Modalidade", 10, "Remoto, híbrido ou presencial, conforme sua preferência."],
  ["Cidade", 10, "Se a vaga é na sua cidade, ou remota."],
  ["Experiência", 10, "Seus anos de experiência diante do mínimo pedido."],
];
const shades = ["bg-tide", "bg-reef", "bg-deep", "bg-[#3C7BD6]", "bg-[#2BA996]"];

export default function About() {
  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-[64ch]">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Sobre o Nautiwork</h1>
          <p className="mt-5 text-lg leading-relaxed text-abyss/80">Uma plataforma de empregabilidade criada como projeto de TCC. Ela reúne candidatos e empresas em um fluxo simples: perfil, vaga, candidatura e acompanhamento.</p>
        </div>

        <section className="mt-14" aria-labelledby="calc">
          <h2 id="calc" className="text-2xl font-semibold sm:text-[28px]">Como a compatibilidade é calculada</h2>
          <p className="mt-3 max-w-[64ch] leading-relaxed text-abyss/80">Cada critério tem um peso fixo, somando 100. A porcentagem de uma vaga é a soma do quanto você atende cada critério, multiplicado pelo peso dele. Quando falta um dado no perfil ou na vaga, o critério sai da conta e os outros são ajustados. Nenhuma inteligência artificial é usada nesta versão.</p>
          <div className="mt-8 flex h-3 overflow-hidden rounded-full" role="img" aria-label="Divisão dos pesos: habilidades 50, área 20, modalidade 10, cidade 10, experiência 10">
            {weights.map(([k, w], i) => <span key={k} className={`${shades[i]} h-full border-r-2 border-fossa last:border-r-0`} style={{ width: `${w}%` }} />)}
          </div>
          <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
            {weights.map(([k, w, d], i) => (
              <div key={k}>
                <dt className="flex items-center gap-2 font-medium"><span className={`h-2.5 w-2.5 rounded-full ${shades[i]}`} aria-hidden="true" />{k}<span className="tabular ml-auto font-display text-abyss/70 lg:ml-0">{w}</span></dt>
                <dd className="mt-1 text-sm leading-relaxed text-abyss/70">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-14 grid gap-px overflow-hidden rounded-panel border border-mist bg-mist md:grid-cols-2">
          <div className="bg-casco p-7"><h2 className="text-lg font-semibold">O que ela não faz</h2><p className="mt-2 text-sm leading-relaxed text-abyss/80">Não avalia sua capacidade, não ordena pessoas por mérito e não decide nada sozinha. É uma pista de onde você se encaixa melhor, e a empresa vê o mesmo número que você.</p></div>
          <div className="bg-casco p-7"><h2 className="text-lg font-semibold">Dados de demonstração</h2><p className="mt-2 text-sm leading-relaxed text-abyss/80">Empresas, vagas e pessoas marcadas com [Demo] são fictícias e servem para testar a plataforma.</p></div>
        </section>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/register" className="btn-primary">Criar perfil</Link><Link href="/jobs" className="btn-ghost">Ver vagas</Link></div>
      </main>
    </>
  );
}
