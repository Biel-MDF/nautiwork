import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import authConfig from "./auth.config";
import { db } from "./db";
import { loginSchema } from "./validators";
import { rateLimit } from "./rate-limit";
import { cookies } from "next/headers";
import { VIEW_COOKIE } from "./view-mode";

// Todo login e logout começa sem modo de visualização: o admin sempre volta à visão de admin.
async function clearViewMode() {
  try { (await cookies()).delete(VIEW_COOKIE); } catch { /* fora de uma requisição: nada a limpar */ }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: { signIn: clearViewMode, signOut: clearViewMode },
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        if (!(await rateLimit(`login:${parsed.data.email}`, 8))) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user || !user.active) return null;
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        return ok ? { id: user.id, name: user.name, email: user.email, role: user.role, sessionVersion: user.sessionVersion } : null;
      },
    }),
  ],
});
