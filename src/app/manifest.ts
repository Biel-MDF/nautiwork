import type { MetadataRoute } from "next";

// App instalável (PWA): no Android e no iPhone, "Adicionar à tela inicial" abre o Nautiwork em
// tela cheia, com ícone próprio. Os atalhos aparecem ao segurar o ícone (Android).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Nautiwork: vagas e carreira",
    short_name: "Nautiwork",
    description: "Vagas com salário visível, compatibilidade com o seu perfil e um assistente de carreira com IA.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#030A1A",
    theme_color: "#030A1A",
    categories: ["business", "education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Buscar vagas", short_name: "Vagas", url: "/jobs", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Assistente com IA", short_name: "Assistente", url: "/assistente", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Meu painel", short_name: "Painel", url: "/candidate/dashboard", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
