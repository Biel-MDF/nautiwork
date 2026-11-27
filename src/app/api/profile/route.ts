import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { profileSchema } from "@/lib/validators";
import { connectSkills } from "@/modules/skills";

export const PUT = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE");
  const { skills, ...data } = profileSchema.parse(await req.json());
  await db.$transaction(async (tx) => {
    const profile = await tx.candidateProfile.update({ where: { userId }, data });
    // mantém o selo "comprovada" das habilidades que continuam no perfil
    const links = await connectSkills(tx, skills);
    const keep = links.map((l) => l.skill.connect.id);
    await tx.candidateSkill.deleteMany({ where: { candidateId: profile.id, skillId: { notIn: keep } } });
    for (const skillId of keep)
      await tx.candidateSkill.upsert({ where: { candidateId_skillId: { candidateId: profile.id, skillId } },
        create: { candidateId: profile.id, skillId }, update: {} });
  });
  return NextResponse.json({ ok: true });
});
