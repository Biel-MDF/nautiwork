import { HomePage } from "@/components/home/HomePage";

// Quem está logado: recomendações, compatibilidade e vagas salvas, montadas na hora.
// Visitantes nem chegam aqui: uma regra de roteamento (next.config) manda para /visitante, que é estática.
export const dynamic = "force-dynamic";

export default async function Home(props: { searchParams: Promise<{ aviso?: string }> }) {
  const { aviso } = await props.searchParams;
  return <HomePage visitor={false} aviso={aviso} />;
}
