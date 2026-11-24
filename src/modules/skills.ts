import type { Prisma } from "@prisma/client";
export async function connectSkills(tx: Prisma.TransactionClient, names: string[]) {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const skills = await Promise.all(
    unique.map((name) => tx.skill.upsert({ where: { name }, update: {}, create: { name } })),
  );
  return skills.map((s) => ({ skill: { connect: { id: s.id } } }));
}
