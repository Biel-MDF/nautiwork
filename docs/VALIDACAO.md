# Validação

Executada em 23/11/2026 com Node 22, npm 10 e PostgreSQL 16 local, a partir de um build limpo. Todos os comandos foram rodados de fato.

| Etapa | Comando | Resultado |
|---|---|---|
| Schema | `npx prisma validate` | válido |
| Migrations | `npx prisma migrate deploy` | 3 migrations: `init`, `user_image`, `email_tokens_session_version` |
| Seed | `npm run db:seed` | ok; pode ser rodado de novo sem erro |
| Tipos | `npx tsc --noEmit` | 0 erros |
| Lint | `npm run lint` (ESLint direto, `--max-warnings=0`) | sem avisos |
| Unitários | `npm test` | 24/24 |
| Integração | `npm run test:integration` | 25/25 |
| Build | `npm run build` (Next 15.5.29) | ok; único aviso: `jose` no Edge (ver README) |
| Desenvolvimento | `npm run dev` | páginas respondem 200; e-mail aparece no console sem chave do Resend |
| Fluxo HTTP | `npm run test:smoke` com `MAIL_DEV_OUTBOX` | 111/111 |
| Otimizador de imagem | `GET /_next/image` | 404 (desligado) |
| Responsividade e acessibilidade | Chrome headless em 320, 360, 768 e 1280 px; 29 páginas; 3 papéis | sem overflow horizontal; campos com rótulo; imagens com `alt`; botões e links com nome; um `h1` por página; alvos de toque com 40 px ou mais |
| Dependências | `npm audit` | 0 vulnerabilidades |

Para confirmar que os testes de integração detectam falhas, as checagens de dono foram removidas de propósito em dois serviços: os testes correspondentes falharam e voltaram a passar depois da restauração. O lint também foi testado com um arquivo de prova (`<img>` sem `alt`) e acusou o problema.

## Produção (https://nautiwork.vercel.app), 24/11/2026
| Etapa | Resultado |
|---|---|
| Build na Vercel | ok; 3 migrations aplicadas no Neon; seed executado uma vez com senhas aleatórias |
| Teste de fluxo HTTP contra a produção | 92/92 (fluxos de e-mail pulados: não há caixa de saída de teste em produção) |
| Limpeza | contas criadas pelo teste desativadas; não aparecem nas páginas públicas |
| `/_next/image` | 404 |

## Não validado
- Envio real pelo Resend e contador real no Upstash: não há chaves no ambiente. As chamadas foram testadas com respostas simuladas.
- Envio de e-mail em produção (falta a chave do Resend).
- Aparelhos reais e leitor de tela.

## Correções feitas durante as validações
- `prisma/schema.prisma` tinha `generator`, `datasource` e `enum` em uma linha só, formato que o Prisma não aceita. Os cerca de 50 erros de `tsc` eram consequência disso.
- O projeto não tinha `prisma/migrations`; a migration inicial foi criada.
- Barra de navegação estourava a tela em 320 px; abaixo de 360 px a logo mostra só o símbolo.
- Campo de envio de arquivo com 38 px de altura ajustado para 44 px.
- Saudação do painel mostrava "Olá, [Demo]"; marcações entre colchetes agora são ignoradas.
