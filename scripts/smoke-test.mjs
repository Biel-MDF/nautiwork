// Teste de fluxo ponta a ponta contra um servidor rodando (npm run dev ou npm start).
// Uso: BASE_URL=http://localhost:3000 node scripts/smoke-test.mjs
// Requer o seed aplicado (npm run db:seed). Cria contas novas a cada execução.

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
// Senhas das contas do seed. Localmente é a padrão; em produção vêm de SEED_PASSWORD e SEED_ADMIN_PASSWORD.
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? "Demo@12345";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? DEMO_PASSWORD;
const createdUsers = []; // contas criadas pelo teste, desativadas no final
const run = Date.now().toString(36);
let passed = 0;
let failed = 0;

function check(name, cond, detail = "") {
  if (cond) { passed++; console.log(`PASSOU  ${name}`); }
  else { failed++; console.log(`FALHOU  ${name} ${detail}`); }
}

class Client {
  constructor(ip) { this.cookies = new Map(); this.ip = ip; }
  cookieHeader() { return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "); }
  store(res) {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
  }
  async req(method, path, body, extra = {}) {
    const headers = { cookie: this.cookieHeader(), "x-forwarded-for": this.ip, ...extra.headers };
    let payload;
    if (body !== undefined) {
      if (extra.form) { headers["content-type"] = "application/x-www-form-urlencoded"; payload = new URLSearchParams(body).toString(); }
      else { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
    }
    const res = await fetch(BASE + path, { method, headers, body: payload, redirect: "manual" });
    this.store(res);
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = undefined; }
    return { status: res.status, json, location: res.headers.get("location"), text };
  }
  async login(email, password) {
    const csrf = await this.req("GET", "/api/auth/csrf");
    const r = await this.req("POST", "/api/auth/callback/credentials",
      { csrfToken: csrf.json.csrfToken, email, password, callbackUrl: BASE + "/" }, { form: true });
    const s = await this.req("GET", "/api/auth/session");
    return { redirect: r, session: s.json };
  }
}

const anon = new Client(`10.0.0.${Math.floor(Math.random() * 200)}`);

// 1. Cadastro
const candEmail = `cand-${run}@teste.local`;
const compEmail = `emp-${run}@teste.local`;
let r = await anon.req("POST", "/api/register", { name: "Candidato Teste", email: candEmail, password: "Senha1234", role: "CANDIDATE" });
check("cadastro de candidato retorna 201", r.status === 201, JSON.stringify(r.json));
r = await anon.req("POST", "/api/register", { name: "Empresa Teste", email: compEmail, password: "Senha1234", role: "COMPANY", companyName: `Empresa ${run}` });
check("cadastro de empresa retorna 201", r.status === 201, JSON.stringify(r.json));
r = await anon.req("POST", "/api/register", { name: "Dup", email: candEmail, password: "Senha1234", role: "CANDIDATE" });
check("e-mail duplicado retorna 409", r.status === 409, `status ${r.status}`);
r = await anon.req("POST", "/api/register", { name: "X", email: "invalido", password: "123", role: "CANDIDATE" });
check("cadastro inválido retorna 400 com campos", r.status === 400 && !!r.json?.fields, `status ${r.status}`);
r = await anon.req("POST", "/api/register", { name: "Empresa sem nome", email: `x-${run}@teste.local`, password: "Senha1234", role: "COMPANY" });
check("empresa sem companyName retorna 400", r.status === 400, `status ${r.status}`);

// 2. Login
const cand = new Client("10.1.0.1");
const comp = new Client("10.1.0.2");
const other = new Client("10.1.0.3");
let l = await cand.login(candEmail, "Senha1234");
if (l.session?.user?.id) createdUsers.push(l.session.user.id);
check("login do candidato cria sessão com papel CANDIDATE", l.session?.user?.role === "CANDIDATE", JSON.stringify(l.session));
l = await comp.login(compEmail, "Senha1234");
if (l.session?.user?.id) createdUsers.push(l.session.user.id);
check("login da empresa cria sessão com papel COMPANY", l.session?.user?.role === "COMPANY", JSON.stringify(l.session));
l = await other.login("mares@demo.nautiwork.test", DEMO_PASSWORD);
check("login da empresa demo (seed) funciona", l.session?.user?.role === "COMPANY", JSON.stringify(l.session));
const bad = new Client("10.1.0.4");
l = await bad.login(candEmail, "senhaErrada1");
check("senha errada não cria sessão", !l.session?.user, JSON.stringify(l.session));

// 3. Criar vaga
const jobBody = {
  title: `Desenvolvedor(a) Next.js ${run}`,
  description: "Vaga de teste criada pelo smoke test para validar o fluxo completo da plataforma.",
  area: "Tecnologia", location: "Recife, PE", workMode: "REMOTE", contractType: "CLT",
  seniority: "JUNIOR", salaryMin: 4000, salaryMax: 6000, minYears: 1, skills: ["TypeScript", "React"],
};
r = await anon.req("POST", "/api/jobs", jobBody);
check("criar vaga sem login retorna 401", r.status === 401, `status ${r.status}`);
r = await cand.req("POST", "/api/jobs", jobBody);
check("candidato criando vaga retorna 403", r.status === 403, `status ${r.status}`);
r = await comp.req("POST", "/api/jobs", { ...jobBody, salaryMin: 9000, salaryMax: 1000 });
check("vaga com salário máximo < mínimo retorna 400", r.status === 400, `status ${r.status}`);
r = await comp.req("POST", "/api/jobs", jobBody);
check("empresa cria vaga (201)", r.status === 201 && r.json?.id, JSON.stringify(r.json));
const jobId = r.json?.id;

// 4. Busca com filtros
r = await anon.req("GET", `/api/jobs?q=${encodeURIComponent(run)}`);
check("busca por texto encontra a vaga nova", r.json?.items?.some((j) => j.id === jobId), `total ${r.json?.total}`);
r = await anon.req("GET", `/api/jobs?q=${run}&workMode=REMOTE&contractType=CLT&location=recife&area=tecno&minSalary=5000&days=1`);
check("busca com todos os filtros compatíveis encontra a vaga", r.json?.items?.some((j) => j.id === jobId), `total ${r.json?.total}`);
r = await anon.req("GET", `/api/jobs?q=${run}&workMode=ONSITE`);
check("filtro de modalidade incompatível exclui a vaga", r.status === 200 && r.json?.total === 0, `total ${r.json?.total}`);
r = await anon.req("GET", `/api/jobs?q=${run}&minSalary=7000`);
check("filtro de salário acima do máximo exclui a vaga", r.json?.total === 0, `total ${r.json?.total}`);
r = await anon.req("GET", "/api/jobs?q=TypeScript");
check("busca por habilidade retorna resultados", r.json?.total > 0, `total ${r.json?.total}`);
r = await anon.req("GET", "/api/jobs?workMode=QUALQUER");
check("filtro inválido retorna 400", r.status === 400, `status ${r.status}`);

// 5. Candidatura
r = await cand.req("POST", "/api/applications", { jobId });
check("candidatura com perfil incompleto retorna 422", r.status === 422, `status ${r.status}`);
r = await cand.req("PUT", "/api/profile", {
  headline: "Dev front-end júnior", location: "Recife, PE", interestArea: "Tecnologia",
  workMode: "REMOTE", yearsExperience: 1, skills: ["TypeScript", "React", "CSS"],
});
check("candidato atualiza perfil", r.status === 200, JSON.stringify(r.json));
r = await cand.req("POST", "/api/applications", { jobId, coverNote: "Tenho interesse." });
check("candidatura criada (201) com compatibilidade calculada", r.status === 201 && typeof r.json?.compatibility === "number", JSON.stringify(r.json));
const appId = r.json?.id;
console.log(`        compatibilidade calculada: ${r.json?.compatibility}`);
r = await cand.req("POST", "/api/applications", { jobId });
check("candidatura duplicada retorna 409", r.status === 409, `status ${r.status}`);
r = await comp.req("POST", "/api/applications", { jobId });
check("empresa tentando se candidatar retorna 403", r.status === 403, `status ${r.status}`);

// 6. Status pela empresa
r = await comp.req("PATCH", `/api/applications/${appId}`, { status: "IN_REVIEW" });
check("empresa dona atualiza status para IN_REVIEW", r.status === 200 && r.json?.status === "IN_REVIEW", JSON.stringify(r.json));
r = await comp.req("PATCH", `/api/applications/${appId}`, { status: "INTERVIEW" });
check("empresa dona atualiza status para INTERVIEW", r.status === 200 && r.json?.status === "INTERVIEW", JSON.stringify(r.json));
r = await comp.req("PATCH", `/api/applications/${appId}`, { status: "WITHDRAWN" });
check("status não permitido à empresa retorna 400", r.status === 400, `status ${r.status}`);

// 7. Isolamento entre empresas
r = await other.req("PATCH", `/api/applications/${appId}`, { status: "REJECTED" });
check("outra empresa mudando status da candidatura retorna 403", r.status === 403, `status ${r.status}`);
r = await other.req("PATCH", `/api/jobs/${jobId}`, { status: "PAUSED" });
check("outra empresa pausando a vaga retorna 403", r.status === 403, `status ${r.status}`);
r = await other.req("PATCH", `/api/jobs/${jobId}`, jobBody);
check("outra empresa editando a vaga retorna 403", r.status === 403, `status ${r.status}`);
r = await comp.req("PATCH", `/api/jobs/naoexiste`, { status: "PAUSED" });
check("vaga inexistente retorna 404", r.status === 404, `status ${r.status}`);

// 8. Barreiras de rota
r = await cand.req("GET", "/company/dashboard");
check("candidato em /company/dashboard é redirecionado", r.status >= 300 && r.status < 400 && !r.location?.includes("/company"), `status ${r.status} -> ${r.location}`);
r = await cand.req("GET", "/admin/users");
check("candidato em /admin/users é redirecionado", r.status >= 300 && r.status < 400, `status ${r.status} -> ${r.location}`);
r = await anon.req("GET", "/candidate/dashboard");
check("anônimo em /candidate/dashboard vai para /login", r.status >= 300 && r.location?.includes("/login"), `status ${r.status} -> ${r.location}`);
r = await cand.req("GET", "/candidate/dashboard");
check("candidato acessa o próprio painel (200)", r.status === 200, `status ${r.status}`);
r = await comp.req("GET", "/company/dashboard");
check("empresa acessa o próprio painel (200)", r.status === 200, `status ${r.status}`);
r = await cand.req("PATCH", "/api/admin/users/qualquer", { active: false });
check("candidato chamando API de admin retorna 403", r.status === 403, `status ${r.status}`);

// 9. Encerramento e retirada
r = await cand.req("DELETE", `/api/applications/${appId}`);
check("candidato retira a candidatura", r.status === 200 && r.json?.status === "WITHDRAWN", JSON.stringify(r.json));
r = await comp.req("PATCH", `/api/applications/${appId}`, { status: "APPROVED" });
check("empresa não altera candidatura retirada (409)", r.status === 409, `status ${r.status}`);
r = await comp.req("PATCH", `/api/jobs/${jobId}`, { status: "CLOSED" });
check("empresa encerra a vaga", r.status === 200 && r.json?.status === "CLOSED", JSON.stringify(r.json));
r = await anon.req("GET", `/api/jobs?q=${run}`);
check("vaga encerrada some da busca pública", r.json?.total === 0, `total ${r.json?.total}`);

// 10. Páginas públicas
for (const p of ["/", "/jobs", "/companies", "/about", "/login", "/register", `/jobs/${jobId}`]) {
  r = await anon.req("GET", p);
  check(`página pública ${p} responde 200`, r.status === 200, `status ${r.status}`);
}

// 11. Prioridade 2: currículo, perfil da empresa, imagens, notificações e páginas novas
r = await cand.req("POST", "/api/profile/educations", { institution: "UFPE", course: "Sistemas de Informação", startYear: 2021, endYear: "" });
check("candidato adiciona formação (201)", r.status === 201 && r.json?.endYear === null, JSON.stringify(r.json));
const eduId = r.json?.id;
r = await cand.req("POST", "/api/profile/educations", { institution: "UFPE", course: "SI", startYear: 2022, endYear: 2020 });
check("formação com conclusão antes do início retorna 400", r.status === 400, `status ${r.status}`);
r = await cand.req("PATCH", `/api/profile/educations/${eduId}`, { institution: "UFPE", course: "Sistemas de Informação", startYear: 2021, endYear: 2025 });
check("candidato edita a formação", r.status === 200 && r.json?.endYear === 2025, JSON.stringify(r.json));
r = await cand.req("POST", "/api/profile/experiences", { company: "Loja Centro", role: "Estagiária", startDate: "2023-02-01", endDate: "", description: "Atendimento" });
check("candidato adiciona experiência (201)", r.status === 201, JSON.stringify(r.json));
const expId = r.json?.id;
r = await comp.req("DELETE", `/api/profile/experiences/${expId}`);
check("empresa chamando API de currículo retorna 403", r.status === 403, `status ${r.status}`);

const cand2 = new Client("10.1.0.5");
const cand2Email = `cand2-${run}@teste.local`;
// IP diferente: o cadastro aceita 5 tentativas por IP a cada 10 minutos.
await new Client("10.2.0.1").req("POST", "/api/register", { name: "Outra Pessoa", email: cand2Email, password: "Senha1234", role: "CANDIDATE" });
const l3 = await cand2.login(cand2Email, "Senha1234");
if (l3.session?.user?.id) createdUsers.push(l3.session.user.id);
r = await cand2.req("DELETE", `/api/profile/educations/${eduId}`);
check("outro candidato apagando formação alheia retorna 404", r.status === 404, `status ${r.status}`);
r = await cand.req("DELETE", `/api/profile/educations/${eduId}`);
check("candidato apaga a própria formação", r.status === 200, `status ${r.status}`);

r = await comp.req("PUT", "/api/company/profile", { name: `Empresa ${run} Ltda`, description: "Empresa de teste.", industry: "Tecnologia", website: "https://exemplo.com.br", location: "Recife, PE" });
check("empresa atualiza o próprio perfil", r.status === 200 && r.json?.website === "https://exemplo.com.br", JSON.stringify(r.json));
r = await comp.req("PUT", "/api/company/profile", { name: `Empresa ${run}`, website: "javascript:alert(1)" });
check("site com esquema inválido retorna 400", r.status === 400, `status ${r.status}`);
r = await cand.req("PUT", "/api/company/profile", { name: "Invasão" });
check("candidato editando perfil de empresa retorna 403", r.status === 403, `status ${r.status}`);

// PNG 1x1 real
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
async function upload(client, bytes, type, name) {
  const fd = new FormData();
  fd.append("file", new Blob([bytes], { type }), name);
  const res = await fetch(BASE + "/api/account/image", { method: "POST", body: fd, headers: { cookie: client.cookieHeader() } });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}
r = await upload(cand, png, "image/png", "foto.png");
check("candidato envia foto PNG (201)", r.status === 201 && r.json?.mimeType === "image/png", JSON.stringify(r.json));
r = await upload(cand, Buffer.from("<svg onload=alert(1)>"), "image/png", "falso.png");
check("arquivo disfarçado de PNG retorna 415", r.status === 415, `status ${r.status}`);
r = await upload(cand, Buffer.alloc(1024 * 1024 + 10, 0xff), "image/jpeg", "grande.jpg");
check("imagem acima de 1 MB retorna 413", r.status === 413, `status ${r.status}`);
r = await upload(comp, png, "image/png", "logo.png");
check("empresa envia logotipo", r.status === 201, `status ${r.status}`);

const candId = (await cand.req("GET", "/api/auth/session")).json?.user?.id;
const compId = (await comp.req("GET", "/api/auth/session")).json?.user?.id;
r = await anon.req("GET", `/api/images/${compId}`);
check("logotipo da empresa é público", r.status === 200, `status ${r.status}`);
r = await anon.req("GET", `/api/images/${candId}`);
check("foto do candidato não é pública (404)", r.status === 404, `status ${r.status}`);
r = await cand.req("GET", `/api/images/${candId}`);
check("candidato vê a própria foto", r.status === 200, `status ${r.status}`);
r = await comp.req("GET", `/api/images/${candId}`);
check("empresa que recebeu candidatura vê a foto", r.status === 200, `status ${r.status}`);
r = await other.req("GET", `/api/images/${candId}`);
check("empresa sem candidatura dele não vê a foto (404)", r.status === 404, `status ${r.status}`);

r = await cand.req("PATCH", "/api/notifications", { all: true });
check("candidato marca todas as notificações como lidas", r.status === 200 && r.json?.updated > 0, JSON.stringify(r.json));
r = await cand.req("PATCH", "/api/notifications", {});
check("marcar notificações sem ids/all retorna 400", r.status === 400, `status ${r.status}`);
r = await cand.req("PUT", "/api/account/password", { currentPassword: "errada999", newPassword: "Nova12345" });
check("troca de senha com senha atual errada retorna 400", r.status === 400, `status ${r.status}`);
r = await cand.req("PATCH", "/api/account", { name: "Candidato Renomeado" });
check("candidato altera o próprio nome", r.status === 200 && r.json?.name === "Candidato Renomeado", JSON.stringify(r.json));

const admin = new Client("10.1.0.6");
await admin.login("admin@demo.nautiwork.test", ADMIN_PASSWORD);
const pages = [
  [cand, ["/candidate/dashboard", "/candidate/profile", "/candidate/resume", "/candidate/applications", "/candidate/saved-jobs", "/candidate/settings"]],
  [comp, ["/company/dashboard", "/company/profile", "/company/jobs", "/company/jobs/new", "/company/applications", "/company/candidates", "/company/candidates?q=TypeScript"]],
  [admin, ["/admin/dashboard", "/admin/users", "/admin/companies", "/admin/jobs"]],
];
for (const [client, list] of pages) for (const p of list) {
  r = await client.req("GET", p);
  check(`página ${p} responde 200 para o papel certo`, r.status === 200, `status ${r.status}`);
}
r = await comp.req("GET", "/company/candidates");
check("lista de candidatos da empresa mostra quem se candidatou", r.text.includes("Candidato Renomeado"), "nome não encontrado");
r = await other.req("GET", "/company/candidates");
check("outra empresa não vê esse candidato", !r.text.includes("Candidato Renomeado"), "nome vazou");
r = await cand.req("GET", "/company/candidates");
check("candidato em /company/candidates é redirecionado", r.status >= 300 && r.status < 400, `status ${r.status}`);
r = await comp.req("GET", "/admin/companies");
check("empresa em /admin/companies é redirecionada", r.status >= 300 && r.status < 400, `status ${r.status}`);

// 12. E-mail: confirmação e redefinição de senha. Precisa do servidor com MAIL_DEV_OUTBOX
// apontando para o mesmo arquivo informado aqui (o servidor grava os e-mails nele).
const OUTBOX = process.env.MAIL_DEV_OUTBOX;
if (!OUTBOX) {
  console.log("PULADO  fluxos de e-mail (defina MAIL_DEV_OUTBOX no servidor e neste comando)");
} else {
  const { readFileSync } = await import("node:fs");
  const mailsTo = (to) => { try { return readFileSync(OUTBOX, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((m) => m.to === to); } catch { return []; } };
  const tokenOf = (m) => /token=([A-Za-z0-9_-]+)/.exec(m?.text ?? "")?.[1];

  const mailUser = new Client("10.3.0.1");
  const mailEmail = `mail-${run}@teste.local`;
  r = await mailUser.req("POST", "/api/register", { name: "Pessoa E-mail", email: mailEmail, password: "Senha1234", role: "CANDIDATE" });
  check("cadastro envia e-mail de confirmação", r.status === 201 && mailsTo(mailEmail).length === 1, `status ${r.status}, e-mails ${mailsTo(mailEmail).length}`);
  const lm = await mailUser.login(mailEmail, "Senha1234");
  if (lm.session?.user?.id) createdUsers.push(lm.session.user.id);
  r = await mailUser.req("GET", "/candidate/dashboard");
  check("painel mostra aviso de e-mail não confirmado", r.text.includes("Confirme seu e-mail"), "aviso ausente");
  r = await mailUser.req("GET", `/verify-email?token=${tokenOf(mailsTo(mailEmail)[0])}`);
  check("abrir o link de confirmação não consome o token sozinho", r.status === 200, `status ${r.status}`);
  r = await anon.req("POST", "/api/email/verify", { token: tokenOf(mailsTo(mailEmail)[0]) });
  check("confirmar e-mail pelo link (200)", r.status === 200, JSON.stringify(r.json));
  r = await anon.req("POST", "/api/email/verify", { token: tokenOf(mailsTo(mailEmail)[0]) });
  check("link de confirmação usado de novo retorna 400", r.status === 400, `status ${r.status}`);
  r = await mailUser.req("GET", "/candidate/dashboard");
  check("aviso some depois da confirmação", r.status === 200 && !r.text.includes("Confirme seu e-mail"), `status ${r.status}`);

  const fp = new Client("10.3.0.2");
  r = await fp.req("POST", "/api/password/forgot", { email: "nao-existe@teste.local" });
  const generic = r.json?.message;
  check("esqueci a senha com e-mail inexistente responde 200", r.status === 200, `status ${r.status}`);
  r = await fp.req("POST", "/api/password/forgot", { email: mailEmail });
  check("esqueci a senha com e-mail real dá a mesma resposta", r.status === 200 && r.json?.message === generic, JSON.stringify(r.json));
  const resetMail = mailsTo(mailEmail).find((m) => m.subject.includes("Redefinição"));
  check("link de redefinição usa APP_URL", !!resetMail && resetMail.text.includes(`${BASE}/reset-password?token=`), resetMail?.text?.slice(0, 120));
  r = await fp.req("POST", "/api/password/reset", { token: tokenOf(resetMail), newPassword: "curta" });
  check("nova senha fraca retorna 400", r.status === 400, `status ${r.status}`);
  r = await fp.req("POST", "/api/password/reset", { token: tokenOf(resetMail), newPassword: "Redefinida123" });
  check("redefinição de senha pelo link (200)", r.status === 200, JSON.stringify(r.json));
  r = await mailUser.req("PUT", "/api/profile", { headline: "x", skills: [] });
  check("sessão aberta antes da redefinição deixa de valer (401)", r.status === 401, `status ${r.status}`);
  r = await mailUser.req("GET", "/candidate/dashboard");
  // Com streaming (loading.tsx), o Next redireciona com <meta refresh> em vez de 307; o importante é ir
  // para /login sem enviar nenhum dado do painel.
  const toLogin = (r.status >= 300 && r.status < 400 && r.location?.includes("/login")) || /http-equiv="refresh" content="[^"]*url=\/login/.test(r.text);
  check("página com sessão antiga manda para o login sem mostrar dados", toLogin && !r.text.includes("Perfil preenchido"), `status ${r.status}`);
  let l2 = await new Client("10.3.0.3").login(mailEmail, "Senha1234");
  check("senha antiga não entra mais", !l2.session?.user, JSON.stringify(l2.session));
  const fresh = new Client("10.3.0.4");
  l2 = await fresh.login(mailEmail, "Redefinida123");
  check("senha nova entra", l2.session?.user?.role === "CANDIDATE", JSON.stringify(l2.session));
  r = await fp.req("POST", "/api/password/reset", { token: tokenOf(resetMail), newPassword: "Outra12345" });
  check("link de redefinição usado de novo retorna 400", r.status === 400, `status ${r.status}`);

  r = await fresh.req("PUT", "/api/account/password", { currentPassword: "Redefinida123", newPassword: "TrocadaLogado1" });
  check("troca de senha logado (200)", r.status === 200, JSON.stringify(r.json));
  r = await fresh.req("PUT", "/api/profile", { headline: "x", skills: [] });
  check("troca de senha encerra a sessão atual (401)", r.status === 401, `status ${r.status}`);
  r = await fresh.req("GET", "/");
  check("navbar não mostra sessão encerrada como logada", r.text.includes("Criar conta") && !r.text.includes("Meu painel"), "navbar ainda logada");
}

// Limpeza: desativa as contas criadas pelo teste (somem das páginas públicas).
if (process.env.SMOKE_CLEANUP === "1") {
  const cleaner = new Client("10.9.0.1");
  await cleaner.login("admin@demo.nautiwork.test", ADMIN_PASSWORD);
  let ok = 0;
  for (const id of createdUsers) { const x = await cleaner.req("PATCH", `/api/admin/users/${id}`, { active: false }); if (x.status === 200) ok++; }
  console.log(`limpeza: ${ok}/${createdUsers.length} contas de teste desativadas`);
}
console.log(`\n${passed} passaram, ${failed} falharam`);
process.exit(failed ? 1 : 0);
