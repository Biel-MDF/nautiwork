import { NextResponse } from "next/server";
import { z } from "zod";
import { HttpError, handle } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { contractLabel, salaryRange, workModeLabel } from "@/lib/labels";
import { matchPool } from "@/modules/public-data";
import { analyzeProfile } from "@/modules/market/match";

export const dynamic = "force-dynamic";

// Os dados digitados só servem para o cálculo: não são gravados em lugar nenhum.
const schema = z.object({
  skills: z.array(z.string().trim().min(1).max(40)).max(30).transform((a) => [...new Set(a)]),
  interestArea: z.string().trim().max(60).optional().default(""),
  workMode: z.enum(["", "REMOTE", "HYBRID", "ONSITE"]).optional().default(""),
  location: z.string().trim().max(80).optional().default(""),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional().default(0),
});

export const POST = handle(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!(await rateLimit(`match:${ip}`, 30, 5 * 60_000))) throw new HttpError(429, "Muitas análises seguidas. Espere alguns minutos.");
  const body = schema.parse(await req.json().catch(() => ({})));
  if (body.skills.length === 0 && !body.interestArea) throw new HttpError(400, "Informe pelo menos uma habilidade ou uma área de interesse.");

  const pool = await matchPool();
  const r = analyzeProfile({ skills: body.skills, interestArea: body.interestArea || null, workMode: body.workMode || null,
    location: body.location || null, yearsExperience: body.yearsExperience }, pool);
  return NextResponse.json({
    analyzed: r.analyzed,
    areas: r.areas,
    skillsToLearn: r.skillsToLearn,
    jobs: r.jobs.map(({ job, score, missing }) => ({
      id: job.id, title: job.title, company: job.company, demo: job.demo, area: job.area, location: job.location,
      workMode: workModeLabel[job.workMode as keyof typeof workModeLabel] ?? job.workMode,
      contract: contractLabel[job.contractType as keyof typeof contractLabel] ?? job.contractType,
      salary: salaryRange(job.salaryMin, job.salaryMax), score, missing,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
});
