import "next-auth";
declare module "next-auth" {
  interface User { role?: "CANDIDATE" | "COMPANY" | "ADMIN"; sessionVersion?: number }
  interface Session { user: { id: string; role: "CANDIDATE" | "COMPANY" | "ADMIN"; sv: number; name?: string | null; email?: string | null } }
}
