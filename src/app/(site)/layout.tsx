import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Páginas públicas: menu e rodapé ficam montados entre uma página e outra,
// só o conteúdo troca (e mostra o esqueleto de carregamento enquanto chega).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </>
  );
}
