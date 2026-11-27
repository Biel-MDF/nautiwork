"use server";
import { signOut } from "@/lib/auth";

/** Sair da conta (usado pelo menu da conta, que agora é montado no navegador). */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
