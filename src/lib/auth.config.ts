import type { NextAuthConfig } from "next-auth";

// Config leve (sem Prisma) — usada também pelo middleware (edge).
export default {
  pages: { signIn: "/login" },
  providers: [],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; role: string; sessionVersion?: number };
        token.id = u.id; token.role = u.role; token.sv = u.sessionVersion ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "CANDIDATE" | "COMPANY" | "ADMIN";
      session.user.sv = (token.sv as number | undefined) ?? 0;
      return session;
    },
  },
} satisfies NextAuthConfig;
