import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);
const areas = { "/candidate": "CANDIDATE", "/company": "COMPANY", "/admin": "ADMIN" } as const;

// Primeira barreira. A autorização real é refeita no servidor (rbac.ts) em cada página/API.
export default auth((req) => {
  const path = req.nextUrl.pathname;
  const area = (Object.keys(areas) as (keyof typeof areas)[]).find((p) => path.startsWith(p));
  if (!area) return;
  if (!req.auth) return NextResponse.redirect(new URL("/login", req.url));
  if (req.auth.user.role !== areas[area]) return NextResponse.redirect(new URL("/", req.url));
});

export const config = { matcher: ["/candidate/:path*", "/company/:path*", "/admin/:path*"] };
