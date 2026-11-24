# Endpoints

| Método | Rota | Quem | Descrição |
|---|---|---|---|
| POST | /api/register | público | Cria candidato ou empresa |
| GET/POST | /api/auth/* | público | Auth.js |
| GET | /api/jobs | público | Busca com filtros: q, area, location, workMode, contractType, minSalary, days, page |
| POST | /api/jobs | empresa | Cria vaga |
| PATCH | /api/jobs/:id | empresa dona | Edita a vaga, ou `{status}` para pausar, reativar ou encerrar |
| POST | /api/applications | candidato | Candidata-se (`{jobId, coverNote?}`) |
| PATCH | /api/applications/:id | empresa dona | Atualiza o status |
| DELETE | /api/applications/:id | candidato dono | Retira a candidatura |
| POST | /api/saved-jobs | candidato | Alterna vaga salva |
| PUT | /api/profile | candidato | Atualiza perfil e habilidades |
| POST | /api/profile/educations | candidato | Adiciona formação (`{institution, course, startYear, endYear?}`) |
| PATCH/DELETE | /api/profile/educations/:id | candidato dono | Edita ou exclui formação |
| POST | /api/profile/experiences | candidato | Adiciona experiência (`{company, role, description?, startDate, endDate?}`, datas ISO) |
| PATCH/DELETE | /api/profile/experiences/:id | candidato dono | Edita ou exclui experiência |
| PUT | /api/company/profile | empresa | `{name, description?, industry?, website?, location?}` |
| PATCH | /api/account | usuário logado | `{name}` |
| PUT | /api/account/password | usuário logado | `{currentPassword, newPassword}`; encerra todas as sessões, inclusive a atual |
| POST | /api/account/image | candidato ou empresa | `multipart/form-data`, campo `file`: PNG, JPEG ou WebP até 1 MB |
| DELETE | /api/account/image | candidato ou empresa | Remove a imagem |
| GET | /api/images/:userId | conforme a regra | Logotipo de empresa: público. Foto de candidato: o próprio, admin ou empresa que recebeu candidatura dele. Caso contrário, 404 |
| PATCH | /api/notifications | usuário logado | `{ids: [...]}` ou `{all: true}`; só afeta as notificações do próprio usuário |
| POST | /api/password/forgot | público | `{email}`; sempre 200 com a mesma mensagem; limite por IP e por e-mail |
| POST | /api/password/reset | público | `{token, newPassword}`; token de uso único, 1 hora; encerra as sessões |
| POST | /api/email/verify | público | `{token}`; confirma o e-mail (token de 24 horas) |
| POST | /api/email/resend | usuário logado | Reenvia o link de confirmação (3 a cada 15 minutos) |
| PATCH | /api/admin/users/:id | admin | `{active}` |
| PATCH | /api/admin/jobs/:id | admin | `{flagged}` |

Erros: JSON `{error, fields?}` com 400, 401, 403, 404, 409, 413 (imagem grande), 415 (formato não aceito), 422, 429, 500 ou 503 (e-mail indisponível no reenvio).
