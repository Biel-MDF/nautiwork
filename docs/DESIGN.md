# Identidade visual: tema "sonar"

O Nautiwork tem nome e logo náuticos. O visual trata a plataforma como o painel de um instrumento de navegação no fundo do mar: escuro, preciso e luminoso, sem neon decorativo.

## Temas

O site tem cinco paletas (Oceano, Lagoa, Coral, Abissal e Alga), cada uma em modo escuro e claro, mais a opção "Sistema", que segue o aparelho. A pessoa escolhe pelo botão de aparência no topo (também na tela de login) ou em Configurações > Aparência. A escolha fica no `localStorage` do aparelho; o padrão é Oceano escuro.

- **Fonte única:** `src/lib/themes.ts` guarda os valores de cada papel por paleta e modo, gera o CSS das variáveis (`--c-<papel>`, em canais RGB) e o script que aplica a escolha no `<html>` antes da primeira pintura, sem piscar o tema errado.
- **Tailwind:** as cores (`fossa`, `tide` etc.) leem as variáveis, com suporte a opacidade (`bg-tide/10`). Nenhum componente usa cor fixa do tema; as exceções são as iniciais sobre cores de avatar e o aviso amarelo do modo "ver como", que valem para todos os temas.
- **Contraste:** `src/tests/themes.test.ts` confere as 10 combinações (texto 7:1 sobre fundo e cartão, texto secundário a 60% com 4,5:1, links e botões com 4,5:1, borda de campo com 3:1). A menor opacidade de texto usada no site é 60%.

## Paleta (Oceano escuro, o tema original)

| Papel | Token Tailwind | Cor | Uso |
|---|---|---|---|
| Fossa | `fossa` | `#030A1A` | fundo da página |
| Casco | `casco` | `#071631` | painéis e cartões |
| Superfície elevada | `foam` | `#0D2347` | etiquetas, item de menu ativo |
| Corrente | `mist` | `#1A3866` | bordas de painéis e divisórias |
| Borda de campo | `line` | `#4269A1` | bordas de campos de formulário (3:1 contra todos os fundos) |
| Texto | `abyss` | `#E3EDFB` | texto principal; secundário com 60% a 90% de opacidade |
| Sonar | `tide` | `#5CB8FF` | ações, links, foco |
| Sonar claro | `deep` | `#9CD3FF` | hover, iniciais |
| Bioluz | `reef` | `#3DE3C3` | compatibilidade alta, sucesso |
| Coral | `coral` | `#FF8270` | erro, recusa |

Os nomes antigos dos tokens foram mantidos como papéis, para que todas as páginas herdassem o tema.

## Tipografia
- Sora (500, 600, 700): títulos.
- IBM Plex Sans (400, 500, 600): texto e interface.
- Números (salários, porcentagens, contagens) com algarismos tabulares (`.tabular`).

## Raios
Painéis 16 px (`rounded-panel`), controles 10 px (`rounded-control`), etiquetas 6 px, selos de status totalmente arredondados.

## Elementos de assinatura
- **Sonar da página inicial** (`src/components/Sonar.tsx`): cada ponto é uma vaga ativa real; a distância do centro indica a idade da vaga. O feixe dá uma volta linear de 2,6 s ao carregar e cada ponto acende quando ele passa. Com "reduzir movimento" ativado no sistema, tudo aparece parado e aceso. Cada ponto é um link com nome acessível e mostra título e empresa no foco ou no hover.
- **Anel de compatibilidade** (`ScoreRing` em `src/components/ui.tsx`): o arco cobre a porcentagem; bioluz a partir de 60%, sonar entre 30% e 59%.
- **Linha do tempo da candidatura**: etapas em sequência, com a atual acesa.

## Acessibilidade verificada
- Contraste WCAG calculado para todas as combinações de texto e fundo: o menor texto fica em 5,3:1 (mínimo exigido: 4,5:1); placeholders em 5,4:1; bordas de campos 3,2:1 ou mais.
- Auditoria automática no Chrome em 320, 360, 768 e 1280 px, 29 páginas e 3 papéis: sem overflow horizontal, campos com rótulo, imagens com `alt`, botões e links com nome, um `h1` por página, alvos de toque com 40 px ou mais.
- Foco visível em todos os controles; `color-scheme: dark` para que os controles nativos sigam o tema.
