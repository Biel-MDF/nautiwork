import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { invalidatePublic } from "@/lib/cache";

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireRole("ADMIN");
  const { flagged } = z.object({ flagged: z.boolean() }).parse(await req.json());
  const job = await db.job.update({ where: { id: (await params).id }, data: { flagged }, select: { id: true, flagged: true } });
  invalidatePublic();
  return NextResponse.json(job);
});
