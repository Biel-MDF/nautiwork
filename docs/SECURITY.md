# Segurança e dependências

Situação em 23/11/2026: `npm audit` (incluindo dependências de desenvolvimento) retorna **0 vulnerabilidades**.

## Atualizações feitas

| Pacote | Antes | Agora | Motivo |
|---|---|---|---|
| next | 14.2.18 | 15.5.29 | A linha 14 não recebe mais correções. A 15.5.29 é a versão de manutenção da linha 15 e fecha as falhas de Server Components, Server Actions, middleware e otimizador de imagem apontadas pelo audit. |
| react, react-dom | 18 | 19 | Exigido pelo App Router do Next 15. |
| eslint-config-next | 14.2.18 | 15.5.29 | Acompanhar o Next; fecha as falhas de `glob` e `minimatch`. |
| next-auth | 5.0.0-beta.25 | 5.0.0-beta.32 | Fecha falha crítica (checagem de sessão que "falha aberta" em erro de configuração) e outras do `@auth/core`. |
| zod | 3.25 | 4.6.7 | Consumo de memória ao validar coleções grandes, corrigido só no Zod 4. Uma linha precisou mudar (`errorMap` virou `error`). |
| vitest | 2.1 | 5.1.1 | Falhas no Vite, esbuild e tinypool (só desenvolvimento). Exige Node 22.12 ou mais novo. |
| postcss (dentro do next) | 8.4.31 | 8.5.33 | O Next 15.5.29 fixa uma versão antiga. Forçada pelo campo `overrides` do `package.json`; o CSS gerado foi conferido depois. |

Por que Next 15.5 e não 16: o 16 troca o `middleware.ts` por `proxy.ts`, remove o `next lint` e muda o empacotador padrão. Seria mais mudança do que a correção exige, e a 15.5 segue recebendo correções.

Mudanças de código da migração: `params` e `searchParams` passaram a ser assíncronos em todas as páginas e rotas (13 arquivos), e o lint passou a rodar pelo ESLint direto (`next lint` está obsoleto).

## Mitigação mantida

`images: { unoptimized: true }` no `next.config.mjs`. O projeto não usa `next/image`, então o endpoint `/_next/image` responde 404 e sai da superfície de ataque.

## Medidas no código

- **Senhas:** bcrypt (custo 12); limite de tentativas no login, no cadastro, na troca e na recuperação de senha.
- **Sessões:** JWT com versão conferida no banco a cada requisição. Conta desativada ou senha trocada ou redefinida derrubam todas as sessões abertas.
- **Tokens de e-mail:**
  - 32 bytes aleatórios, guardados só como hash SHA-256.
  - De uso único (marcação atômica, testada com duas requisições simultâneas) e com validade: 1 hora para senha, 24 horas para confirmação.
  - Um pedido novo invalida o anterior.
- **Links nos e-mails:** sempre montados a partir de `APP_URL` em produção. Montar a partir do cabeçalho `Host` permitiria que um atacante forjasse o Host e recebesse o token de outra pessoa.
- **"Esqueci a senha":** mesma resposta para e-mail cadastrado ou não, e nenhum envio para conta desativada.
- **Logs:** em produção sem chave do Resend, o aviso no log não inclui o link.
- **Autorização:** refeita no servidor em toda página e API, com checagem de propriedade nos serviços.
- **Upload:**
  - Tipo conferido pelos bytes do arquivo (SVG recusado, porque pode conter script).
  - Limite de 1 MB checado antes e depois de ler o corpo.
  - Resposta com `nosniff` e CSP restritiva.
- **Links externos do perfil da empresa:** só `http://` e `https://`, com `rel="noopener noreferrer nofollow"`.
- **HTML dos e-mails:** os dados do usuário são escapados (testado com `<script>` no nome).

## Pontos em aberto

- O "esqueci a senha" pode responder em tempos diferentes quando a conta existe, porque há envio de e-mail. Isso dá margem para descobrir se um e-mail está cadastrado. Uma fila de envio resolveria.
- Sem Upstash configurado, o limite de tentativas é por instância e se baseia em `x-forwarded-for`, que só é confiável atrás de um proxy que reescreva o cabeçalho (a Vercel faz isso).
