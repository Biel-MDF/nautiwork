import { describe, expect, it } from "vitest";
import { jobPostingJsonLd, jsonLdScript, snippet } from "@/lib/seo";

const job = {
  id: "j1", title: "Dev Júnior", description: "Construir telas <b>bonitas</b> & rápidas.", responsibilities: null, requirements: "React",
  location: "Recife", workMode: "REMOTE", contractType: "CLT", salaryMin: 3000, salaryMax: 4000,
  publishedAt: new Date("2026-11-20T10:00:00Z"), company: { name: "Empresa Real", website: "https://empresa.test" },
};

describe("JobPosting (Google for Jobs)", () => {
  it("monta os campos exigidos pelo Google", () => {
    const d = jobPostingJsonLd(job)!;
    expect(d["@type"]).toBe("JobPosting");
    expect(d.employmentType).toBe("FULL_TIME");
    expect(d.jobLocationType).toBe("TELECOMMUTE");
    expect(d.baseSalary).toMatchObject({ currency: "BRL", value: { minValue: 3000, maxValue: 4000, unitText: "MONTH" } });
    expect(d.hiringOrganization).toMatchObject({ name: "Empresa Real", sameAs: "https://empresa.test" });
    expect(String(d.description)).toContain("&lt;b>");
  });
  it("não anuncia vaga da demonstração", () => {
    expect(jobPostingJsonLd({ ...job, company: { name: "[Demo] Fictícia", website: null } })).toBeNull();
  });
  it("o script não pode ser fechado pelo texto da vaga", () => {
    expect(jsonLdScript({ t: "</script><script>alert(1)</script>" }).__html).not.toContain("</script>");
  });
  it("resume a descrição sem cortar palavra", () => {
    const s = snippet("palavra ".repeat(40), 30);
    expect(s.length).toBeLessThanOrEqual(31);
    expect(s.endsWith("…")).toBe(true);
  });
});
