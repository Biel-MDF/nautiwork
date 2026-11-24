import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/rbac";
import { Shell } from "@/components/Shell";
import { ProfileForm } from "@/components/forms";

export const dynamic = "force-dynamic";
export default async function ProfilePage() {
  const user = await requirePageRole("CANDIDATE");
  const p = await db.candidateProfile.findUnique({ where: { userId: user.id }, include: { skills: { include: { skill: true } } } });
  return (
    <Shell role="CANDIDATE" title="Meu perfil">
      <ProfileForm initial={{ headline: p?.headline ?? "", about: p?.about ?? "", location: p?.location ?? "", interestArea: p?.interestArea ?? "",
        workMode: p?.workMode ?? "", objective: p?.objective ?? "", yearsExperience: p?.yearsExperience ?? 0, skills: p?.skills.map((s) => s.skill.name).join(", ") ?? "" }} />
    </Shell>
  );
}
