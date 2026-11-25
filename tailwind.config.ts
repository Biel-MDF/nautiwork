import type { Config } from "tailwindcss";

// Tema "sonar": painel de instrumento no fundo do mar, em cinco paletas com modo claro e escuro.
// Os nomes são papéis (abyss = texto, foam = superfície elevada, mist = borda, tide = destaque);
// os valores de cada paleta ficam em src/lib/themes.ts.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // As cores vêm de variáveis CSS definidas em src/lib/themes.ts (paleta + modo claro/escuro).
      colors: Object.fromEntries(
        ["fossa", "casco", "abyss", "foam", "mist", "tide", "deep", "reef", "coral", "field", "line"]
          .map((r) => [r, `rgb(var(--c-${r}) / <alpha-value>)`]),
      ),
      fontFamily: { display: ["var(--font-display)"], sans: ["var(--font-body)"] },
      borderRadius: { panel: "16px", control: "10px" },
      keyframes: {
        sweep: { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        contact: { "0%": { opacity: "0", transform: "scale(.4)" }, "60%": { opacity: "1", transform: "scale(1.35)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        menu: { from: { opacity: "0", transform: "translateY(-4px) scale(.98)" }, to: { opacity: "1", transform: "none" } },
        // eco do contato: acende quando o feixe passa e vai apagando até a próxima volta
        echo: { "0%": { transform: "scale(1.18)", boxShadow: "0 0 0 6px rgb(var(--c-reef) / 0.28), 0 0 26px rgb(var(--c-reef) / 0.75)" }, "35%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 3px rgb(var(--c-reef) / 0.10), 0 0 10px rgb(var(--c-reef) / 0.25)" } },
        radar: { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(-360deg)" } },
        blink: { "0%, 100%": { opacity: ".35" }, "12%": { opacity: "1" }, "40%": { opacity: ".7" } },
        "ping-wave": { "0%": { strokeOpacity: "0", transform: "translateY(8px)" }, "30%": { strokeOpacity: "1" }, "100%": { strokeOpacity: "0", transform: "translateY(-10px)" } },
      },
      animation: {
        sweep: "sweep 2600ms linear 1 both", // linear: cada ponto acende quando o feixe passa por ele
        contact: "contact 600ms ease-out both",
        menu: "menu 140ms ease-out",
        radar: "radar 6s linear infinite",
        "sweep-loop": "sweep 6s linear infinite",
        echo: "echo 6s ease-out infinite",
        blink: "blink 3.3s ease-in-out infinite",
        "ping-wave": "ping-wave 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
