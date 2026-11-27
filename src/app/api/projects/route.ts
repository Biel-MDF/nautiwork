import { NextResponse } from "next/server";
import { HttpError, handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl } from "@/lib/app-url";
import { createProject } from "@/modules/projects.service";

export const POST = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE");
  if (!(await rateLimit(`project:${userId}`, 10, 86_400_000))) throw new HttpError(429, "Muitos projetos cadastrados hoje. Tente amanhã.");
  const { project, link, emailed } = await createProject(userId, await req.json(), appUrl(req));
  return NextResponse.json({ id: project.id, link, emailed }, { status: 201 });
});
