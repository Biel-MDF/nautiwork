import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { createJob, searchJobs } from "@/modules/jobs.service";

export const GET = handle(async (req: Request) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  return NextResponse.json(await searchJobs(params));
});

export const POST = handle(async (req: Request) => {
  const { userId } = await requireRole("COMPANY");
  const job = await createJob(userId, await req.json());
  return NextResponse.json(job, { status: 201 });
});
