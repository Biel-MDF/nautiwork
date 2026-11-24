import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { jobStatusSchema } from "@/lib/validators";
import { setJobStatus, updateJob } from "@/modules/jobs.service";

type Ctx = { params: Promise<{ id: string }> };

// PATCH com { status } pausa/reativa/encerra; com o formulário completo, edita a vaga.
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const { userId } = await requireRole("COMPANY");
  const body = await req.json();
  if (Object.keys(body).length === 1 && "status" in body) {
    const { status } = jobStatusSchema.parse(body);
    return NextResponse.json(await setJobStatus(userId, (await params).id, status));
  }
  return NextResponse.json(await updateJob(userId, (await params).id, body));
});
