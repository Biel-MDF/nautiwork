import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { startCheck } from "@/modules/skill-checks.service";

/** Começa uma prova de habilidade: devolve as questões sorteadas, sem as respostas. */
export const POST = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE");
  const { skill } = z.object({ skill: z.string().min(1).max(40) }).parse(await req.json());
  return NextResponse.json(await startCheck(userId, skill), { status: 201 });
});
