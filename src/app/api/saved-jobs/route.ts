import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";

// Alterna salvar/remover. A chave composta evita duplicidade.
export const POST = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE");
  const { jobId } = z.object({ jobId: z.string().min(1) }).parse(await req.json());
  const profile = await db.candidateProfile.findUnique({ where: { userId } });
  if (!profile) throw new HttpError(400, "Perfil não encontrado.");
  const key = { candidateId_jobId: { candidateId: profile.id, jobId } };
  const existing = await db.savedJob.findUnique({ where: key });
  if (existing) { await db.savedJob.delete({ where: key }); return NextResponse.json({ saved: false }); }
  if (!(await db.job.findUnique({ where: { id: jobId } }))) throw new HttpError(404, "Vaga não encontrada.");
  await db.savedJob.create({ data: { candidateId: profile.id, jobId } });
  return NextResponse.json({ saved: true });
});
