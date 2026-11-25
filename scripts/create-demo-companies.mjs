// Cria pelo próprio site (API pública) as empresas fictícias de prisma/demo-companies.json.
// Uso: BASE_URL=https://nautiwork.vercel.app node scripts/create-demo-companies.mjs
// Cada empresa recebe uma senha aleatória que não é guardada: são contas só de vitrine.
// Pode rodar de novo: quem já existe (409) é pulado. Respeita o limite de cadastros por IP.
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const D = "@demo.nautiwork.test";
const companies = JSON.parse(readFileSync(new URL("../prisma/demo-companies.json", import.meta.url), "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Client {
  cookies = new Map();
  store(res) { for (const c of res.headers.getSetCookie?.() ?? []) { const [p] = c.split(";"); const i = p.indexOf("="); this.cookies.set(p.slice(0, i), p.slice(i + 1)); } }
  async req(method, path, body, form = false) {
    const headers = { cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ") };
    let payload;
    if (body !== undefined) {
      headers["content-type"] = form ? "application/x-www-form-urlencoded" : "application/json";
      payload = form ? new URLSearchParams(body).toString() : JSON.stringify(body);
    }
    const res = await fetch(BASE + path, { method, headers, body: payload, redirect: "manual" });
    this.store(res);
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { /* html */ }
    return { status: res.status, json };
  }
  async login(email, password) {
    const csrf = await this.req("GET", "/api/auth/csrf");
    await this.req("POST", "/api/auth/callback/credentials", { csrfToken: csrf.json.csrfToken, email, password, callbackUrl: BASE + "/" }, true);
    return (await this.req("GET", "/api/auth/session")).json?.user;
  }
}

for (const c of companies) {
  const email = `${c.email}${D}`;
  const password = randomBytes(18).toString("base64url") + "9a";
  const anon = new Client();
  let r;
  for (;;) {
    r = await anon.req("POST", "/api/register", { acceptTerms: true, name: c.name, email, password, role: "COMPANY", companyName: c.name });
    if (r.status !== 429) break;
    console.log("limite de cadastros atingido, esperando 2 minutos...");
    await sleep(120_000);
  }
  if (r.status === 409) { console.log(`já existe: ${c.name}`); continue; }
  if (r.status !== 201) { console.log(`falhou ${c.name}: ${r.status} ${JSON.stringify(r.json)}`); continue; }

  const s = new Client();
  if (!(await s.login(email, password))) { console.log(`login falhou: ${c.name}`); continue; }
  r = await s.req("PUT", "/api/company/profile", { name: c.name, description: c.description, industry: c.industry, website: c.website, location: c.location });
  let ok = 0;
  for (const j of c.jobs) {
    const { description, ...rest } = j;
    const jr = await s.req("POST", "/api/jobs", { ...rest, description, requirements: `Conhecimento em ${j.skills.join(", ")}.`, benefits: "Vale-refeição, plano de saúde" });
    if (jr.status === 201) ok++; else console.log(`  vaga falhou (${j.title}): ${jr.status} ${JSON.stringify(jr.json)}`);
  }
  console.log(`criada: ${c.name} (perfil ${r.status}, ${ok}/${c.jobs.length} vagas)`);
}
