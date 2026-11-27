import { NextResponse } from "next/server";
import { HttpError, handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { reportJob } from "@/modules/reports.service";

type Ctx = { params: Promise<{ id: string }> };

/** Denunciar vaga suspeita (qualquer conta). */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  if (!(await rateLimit(`report:${userId}`, 10, 86_400_000))) throw new HttpError(429, "Você fez muitas denúncias hoje. Tente amanhã.");
  return NextResponse.json(await reportJob(userId, (await params).id, await req.json()), { status: 201 });
});
