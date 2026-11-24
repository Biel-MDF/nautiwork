import type { Config } from "tailwindcss";

// Tema "sonar": painel de instrumento no fundo do mar.
// Os nomes antigos foram mantidos como papéis (abyss = texto, foam = superfície elevada,
// mist = borda, tide = destaque) para que todas as páginas herdem o tema sem reescrita.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fossa: "#030A1A",   // fundo da página
        casco: "#071631",   // painéis e cartões
        abyss: "#E3EDFB",   // texto principal
        foam: "#0D2347",    // superfícies elevadas (etiquetas, itens destacados)
        mist: "#1A3866",    // bordas
        tide: "#5CB8FF",    // sonar: ações, links, foco
        deep: "#9CD3FF",    // sonar claro: hover e iniciais
        reef: "#3DE3C3",    // bioluz: compatibilidade e sucesso
        coral: "#FF8270",   // erro e recusa
      },
      fontFamily: { display: ["var(--font-display)"], sans: ["var(--font-body)"] },
      borderRadius: { panel: "16px", control: "10px" },
      keyframes: {
        sweep: { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        contact: { "0%": { opacity: "0", transform: "scale(.4)" }, "60%": { opacity: "1", transform: "scale(1.35)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        menu: { from: { opacity: "0", transform: "translateY(-4px) scale(.98)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        sweep: "sweep 2600ms linear 1 both", // linear: cada ponto acende quando o feixe passa por ele
        contact: "contact 600ms ease-out both",
        menu: "menu 140ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
