import { NextResponse } from "next/server";
import { HttpError, handle } from "@/lib/errors";
import { currentUser } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { validateProject } from "@/modules/projects.service";

/** O professor confirma o projeto pelo link (sem conta). */
export const POST = handle(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!(await rateLimit(`project-validate:${ip}`, 20, 3_600_000))) throw new HttpError(429, "Muitas tentativas. Tente mais tarde.");
  const me = await currentUser();
  return NextResponse.json(await validateProject(await req.json(), me?.id ?? null));
});
