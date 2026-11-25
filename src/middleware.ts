import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { VIEW_COOKIE, parseViewMode } from "@/lib/view-mode";

const { auth } = NextAuth(authConfig);
const areas = { "/candidate": "CANDIDATE", "/company": "COMPANY", "/admin": "ADMIN" } as const;
const previewArea = { CANDIDATE: "candidate", COMPANY: "company" } as const;
const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

// Primeira barreira. A autorização real é refeita no servidor (rbac.ts) em cada página/API.
export default auth((req) => {
  const path = req.nextUrl.pathname;
  const role = req.auth?.user.role;
  const mode = role === "ADMIN" ? parseViewMode(req.cookies.get(VIEW_COOKIE)?.value) : null;

  // Modo de visualização: só olhar. Qualquer ação que muda dados é recusada,
  // menos trocar/sair do modo, o próprio login/logout e o assistente (que só consulta).
  if (path.startsWith("/api/")) {
    if (mode && !SAFE.has(req.method) && !path.startsWith("/api/admin/view") && !path.startsWith("/api/auth") && path !== "/api/assistant") {
      return NextResponse.json({ error: "Você está no modo de visualização: as ações ficam desativadas. Volte ao modo admin para alterar dados." }, { status: 403 });
    }
    return;
  }

  const area = (Object.keys(areas) as (keyof typeof areas)[]).find((p) => path.startsWith(p));
  if (!area) return;
  if (!req.auth) return NextResponse.redirect(new URL("/login", req.url));
  const needed = areas[area];
  if (role === needed) return;
  // admin vendo como candidato/empresa entra na área correspondente
  if (needed !== "ADMIN" && mode === previewArea[needed]) return;
  return NextResponse.redirect(new URL("/", req.url));
});

export const config = { matcher: ["/candidate/:path*", "/company/:path*", "/admin/:path*", "/api/:path*"] };
