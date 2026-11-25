# Nautiwork

Site: https://nautiwork.vercel.app · Código: https://github.com/Biel-MDF/nautiwork

Plataforma de empregabilidade (projeto de TCC) que conecta candidatos e empresas: perfil profissional e currículo, busca de vagas, candidatura, acompanhamento de status e gestão de recrutamento.

## Tecnologias
Next.js 15.5.29 (App Router), React 19, TypeScript, Tailwind CSS 3, PostgreSQL, Prisma 5, Auth.js (next-auth 5.0.0-beta.32, credenciais + JWT), Zod 4, Vitest 5, bcryptjs. E-mail pelo Resend e limite de tentativas pelo Upstash Redis, ambos opcionais e chamados por HTTP, sem SDK.

## Funcionalidades
- Cadastro, login e logout; senhas com bcrypt; sessão JWT conferida no banco a cada requisição (conta ativa e versão de sessão).
- Confirmação de e-mail (link enviado no cadastro, reenvio pelo painel) e recuperação de senha por e-mail (link de uso único, válido por 1 hora). A resposta de "esqueci a senha" é a mesma exista ou não a conta.
- Trocar ou redefinir a senha encerra todas as sessões abertas.
- Limite de tentativas em cadastro, login, troca e recuperação de senha e confirmação de e-mail: compartilhado entre instâncias quando o Upstash está configurado; em memória quando não está.
- Três perfis (candidato, empresa, administrador) com autorização no servidor (`src/lib/rbac.ts`) e middleware como primeira barreira.
- **Candidato:** perfil e habilidades; currículo com formação e experiência (adicionar, editar, excluir); foto; nome e senha; busca e filtros de vagas; vagas salvas; candidatura sem duplicidade; retirada; histórico de status; notificações com "marcar como lida".
- **Empresa:** perfil editável (nome, descrição, área, site, cidade) e logotipo; criar, editar, pausar, reativar e encerrar vagas; candidaturas ordenadas por compatibilidade; atualização de status; lista de candidatos que se candidataram às suas vagas, com busca; notificações.
- **Administrador:** métricas, contas (desativar/reativar), empresas (vagas, candidaturas, desativação) e moderação de vagas.
- **Compatibilidade por regras** (`src/modules/compatibility.ts`): habilidades 50, área 20, modalidade 10, cidade 10, experiência 10; critérios sem dado são ignorados e os pesos renormalizados. Sem IA.
- **Imagens:** foto e logotipo em PNG, JPEG ou WebP, até 1 MB, gravados no próprio PostgreSQL (tabela `UserImage`). O formato é conferido pelos bytes do arquivo, não pela extensão. Logotipo de empresa é público; foto de candidato só aparece para o próprio candidato, para administradores e para empresas que receberam candidatura dele.
- Notificações gravadas no banco (não são em tempo real) e, para quem deixa ligado nas Configurações, também enviadas por e-mail.
- **Menu da conta:** avatar no canto superior direito (foto ou inicial colorida) com Meu painel, Configurações de perfil, Configurações (janela com Conta, Foto, Segurança, Notificações e Privacidade), Suporte e Sair.
- **LGPD:** páginas de Política de Privacidade (`/privacidade`) e Termos de Uso (`/termos`); aceite obrigatório no cadastro, com data e versão gravadas (`termsAcceptedAt`, `termsVersion`; versão em `src/lib/legal.ts`); em Configurações, Privacidade: baixar os próprios dados em JSON e excluir a conta (senha + palavra EXCLUIR). A exclusão apaga tudo em cascata; se for empresa, os candidatos com processo em andamento são avisados. Administrador não se exclui por ali.
- **Monitoramento de erros (Sentry):** erros do servidor, das rotas de API e das telas vão para o Sentry quando `NEXT_PUBLIC_SENTRY_DSN` existe; sem ele o SDK fica desligado. Sem gravação de sessão e sem dados pessoais (`sendDefaultPii: false`). Um admin confere a instalação abrindo `/api/admin/sentry-test`.
- **Suporte:** pedidos com categoria e conversa entre usuário e equipe, fila para o administrador com filtros por status, aviso no site e por e-mail a cada resposta, limite de 5 pedidos abertos por pessoa.

## Visual
Tema escuro "sonar", inspirado em instrumentos de navegação. Paleta, tipografia, componentes de assinatura e verificações de acessibilidade estão em `docs/DESIGN.md`.

## Pré-requisitos
Node.js 22.12 ou mais recente (exigido pelo Vitest 5; o Node 20 saiu de suporte em abril de 2026), npm, PostgreSQL 14 ou mais recente.

## Instalação
```bash
npm install
cp .env.example .env        # preencha DATABASE_URL, AUTH_SECRET (openssl rand -base64 32) e APP_URL
npx prisma migrate deploy   # aplica as migrations de prisma/migrations
npm run db:seed
npm run dev                 # http://localhost:3000
```
PostgreSQL rápido com Docker: `docker run -d -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nautiwork -p 5432:5432 postgres:16`

Ao mudar o `schema.prisma`, crie uma nova migration com `npx prisma migrate dev --name descricao`.

### Variáveis de ambiente
| Variável | Obrigatória | Para quê |
|---|---|---|
| `DATABASE_URL` | sim | PostgreSQL |
| `AUTH_SECRET` | sim | Assinatura das sessões (Auth.js) |
| `APP_URL` | sim em produção | Endereço público usado nos links dos e-mails. Em produção os links nunca são montados a partir do cabeçalho `Host` (que pode ser forjado) |
| `RESEND_API_KEY`, `EMAIL_FROM` | para enviar e-mail de verdade | Conta no Resend com domínio verificado. Sem elas, em desenvolvimento os e-mails aparecem no console do servidor; em produção não são enviados |
| `SUPPORT_EMAIL` | para receber pedidos de suporte por e-mail | Endereço da equipe. Não aparece no site; o e-mail sai com "responder para" o usuário |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | recomendadas em produção | Limite de tentativas compartilhado entre instâncias |
| `TEST_DATABASE_URL` | só para testes | Banco descartável do `test:integration` |
| `MAIL_DEV_OUTBOX` | só para testes | Grava os e-mails em um arquivo em vez de enviar |

## Testes
| Comando | O que roda | Precisa de |
|---|---|---|
| `npm test` | Unitários: compatibilidade, validações, checagem de imagem, limite de tentativas, envio de e-mail | nada |
| `npm run test:integration` | Serviços contra um PostgreSQL real: candidatura duplicada (inclusive simultânea), permissões entre empresas, status e histórico, currículo, notificações, senha, imagens, tokens de e-mail (uso único, expiração, uso simultâneo) | `TEST_DATABASE_URL` no `.env` |
| `npm run test:smoke` | Fluxo HTTP completo contra o servidor rodando (cadastro, login, vagas, filtros, candidatura, 401/403/404/409, páginas por papel, upload, confirmação de e-mail, recuperação de senha, queda de sessão) | servidor em `localhost:3000` e seed aplicado |

**Integração contínua:** `.github/workflows/ci.yml` roda tipos, lint, testes unitários, de integração (PostgreSQL em container) e o smoke test completo contra um build de produção, em todo push na `main` e em todo pull request. O resultado aparece na aba Actions do GitHub e como um sinal verde ou vermelho em cada commit.

O teste de integração **apaga e recria** o banco de `TEST_DATABASE_URL`. Por segurança, ele se recusa a rodar se a URL for igual a `DATABASE_URL` ou se o nome do banco não tiver "test".

Para o teste de fluxo: `npm run build && MAIL_DEV_OUTBOX=/tmp/outbox.jsonl npm start` em um terminal e `MAIL_DEV_OUTBOX=/tmp/outbox.jsonl npm run test:smoke` em outro (o mesmo arquivo nos dois). Sem `MAIL_DEV_OUTBOX`, a parte de e-mail é pulada. Use `BASE_URL` para outro endereço.

## Contas de demonstração (após o seed)
Senha de todas: `Demo@12345`
- `admin@demo.nautiwork.test` (administrador)
- `mares@demo.nautiwork.test` e `farol@demo.nautiwork.test` (empresas)
- `ana@demo.nautiwork.test`, `bruno@demo.nautiwork.test`, `carla@demo.nautiwork.test` (candidatos)

Todos os dados do seed são fictícios e marcados com "[Demo]".

## Estrutura
```
prisma/            schema, migrations e seed
scripts/           teste de fluxo HTTP (smoke-test.mjs)
src/app/           páginas e Route Handlers (api/)
src/components/    UI e formulários (client)
src/modules/       regras de negócio (vagas, candidaturas, currículo, conta, imagens, compatibilidade)
src/lib/           auth, rbac, validações (Zod), db, erros
src/tests/         testes unitários; src/tests/integration/ com os de banco
docs/              arquitetura, endpoints e segurança
```

## Deploy
Publicado em **https://nautiwork.vercel.app** (Vercel, plano Hobby, time Noxus), com PostgreSQL do Neon provisionado pelo Marketplace da Vercel (região us-east-1).

Como está montado:
- **Build:** a Vercel roda o script `vercel-build`: `prisma generate`, `prisma migrate deploy` (pela conexão direta `DATABASE_URL_UNPOOLED`), `scripts/seed-on-deploy.mjs` e `next build`. Node 22.x.
- **Seed:** só roda com `SEED_ON_DEPLOY=1`. Foi usado uma vez, no primeiro deploy, e a variável foi removida em seguida, porque o seed apaga e recria os dados de demonstração. Em produção, as senhas das contas demo vêm de `SEED_PASSWORD` e `SEED_ADMIN_PASSWORD` (aleatórias); a senha padrão do README só vale localmente.
- **Variáveis na Vercel:** as do Neon (criadas pela integração), `AUTH_SECRET`, `APP_URL=https://nautiwork.vercel.app`, `SEED_PASSWORD` e `SEED_ADMIN_PASSWORD`.
- **`.vercelignore`:** impede o envio do `.env` local, do `.next` e do `node_modules`.
- **Ainda sem configurar:** `RESEND_API_KEY` e `EMAIL_FROM` (os e-mails não são enviados em produção) e Upstash (o limite de tentativas fica em memória por instância).

Publicação automática: o projeto na Vercel está ligado a este repositório. Cada push na `main` gera um deploy de produção; outras branches geram prévias.

O banco de produção não aceita conexão direta de fora da Vercel a partir de redes com a porta 5432 bloqueada; nesses casos, migrations e seed rodam pelo build.

Teste de fluxo contra a produção: `BASE_URL=https://nautiwork.vercel.app SEED_PASSWORD=... SEED_ADMIN_PASSWORD=... SMOKE_CLEANUP=1 npm run test:smoke`. Com `SMOKE_CLEANUP=1`, as contas criadas pelo teste são desativadas no final.

## Limitações conhecidas
- O e-mail usa o remetente de teste do Resend (`onboarding@resend.dev`), que só entrega para o dono da conta do Resend. Para enviar a qualquer usuário é preciso verificar um domínio próprio. O Redis (Upstash) ainda não está configurado.
- Contas criadas antes do aceite dos termos (24/11/2026) não têm `termsAcceptedAt`; não há tela pedindo o aceite a elas.
- Os textos de Privacidade e Termos foram escritos para o projeto, mas não passaram por revisão jurídica.
- Com o Next 15, quando a sessão é derrubada (senha trocada) e a pessoa abre uma página protegida, o redirecionamento para o login é feito por `<meta refresh>` e não por um 307, porque a página já começou a ser enviada (`loading.tsx`). Nenhum dado da página é enviado; o teste de fluxo confere isso.
- O "esqueci a senha" responde igual para e-mail existente ou não, mas o tempo de resposta pode diferir (quando a conta existe, há envio de e-mail).
- Confirmar o e-mail não é obrigatório para usar a plataforma; o painel mostra um aviso até a confirmação.
- O `next build` mostra um aviso do pacote `jose` (dependência do Auth.js) sobre `CompressionStream` no Edge Runtime. É um alerta da análise estática: o middleware funciona e foi testado em todos os redirecionamentos.
- O `postcss` usado internamente pelo Next foi forçado para 8.5.33 (campo `overrides` do `package.json`) para fechar falhas do 8.4.31. O CSS gerado foi conferido depois da troca. Ao atualizar o Next, vale remover o override e checar se ainda é necessário.
- Imagens no banco funcionam bem no volume de um TCC; com muitos usuários, o ideal é um armazenamento de objetos (S3, Vercel Blob), o que exige credenciais externas.
- Responsividade e acessibilidade básica verificadas de forma automatizada no Chrome (320, 360, 768 e 1280 px); não houve teste em aparelhos reais nem com leitor de tela.

## Próximas evoluções
Configurar Resend e Upstash no deploy, armazenamento de objetos para imagens, Next 16 quando o Auth.js v5 sair do beta, IA como camada opcional sobre a compatibilidade.
