import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";

// Página inicial de quem não está logado. Pronta de antemão e refeita no máximo a cada minuto
// (ou na hora, quando uma vaga muda): sai da CDN perto de quem acessa, sem esperar o servidor
// acordar. O endereço que a pessoa vê continua sendo "/" (regra de reescrita no next.config).
export const revalidate = 60;
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function VisitorHome() {
  return <HomePage visitor />;
}
