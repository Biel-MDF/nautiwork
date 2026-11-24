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
    await tx.candidateSkill.deleteMany({ where: { candidateId: profile.id } });
    const links = await connectSkills(tx, skills);
    for (const l of links)
      await tx.candidateSkill.create({ data: { candidateId: profile.id, skillId: l.skill.connect.id } });
  });
  return NextResponse.json({ ok: true });
});
