-- Dados de demonstração dos diferenciais. Só mexe em contas @demo.nautiwork.test; se elas
-- não existirem (banco de teste), nenhuma linha é afetada. Ids fixos + ON CONFLICT: rodar de
-- novo não duplica nada. O seed executa este mesmo arquivo depois de recriar as contas demo.

INSERT INTO "Skill" ("id", "name") VALUES ('demo_sk_org', 'Organização'), ('demo_sk_com', 'Comunicação'), ('demo_sk_excel', 'Excel'), ('demo_sk_rn', 'React Native')
ON CONFLICT ("name") DO NOTHING;

-- Vaga de Jovem Aprendiz (Âncora Logística, Santos)
INSERT INTO "Job" ("id", "companyId", "title", "description", "responsibilities", "requirements", "benefits", "area", "location", "workMode", "contractType", "seniority", "salaryMin", "salaryMax", "minYears", "forApprentice", "lat", "lng", "publishedAt", "confirmedAt", "updatedAt")
SELECT 'demo_job_aprendiz', c."id", 'Jovem Aprendiz Administrativo', 'Vaga fictícia de demonstração. Programa de aprendizagem com aulas teóricas uma vez por semana e prática no setor administrativo.',
  'Organizar documentos, apoiar o controle de estoque e atender fornecedores.', 'Estar cursando ou ter concluído o ensino médio. Não exige experiência.', 'Vale-transporte, vale-refeição e uniforme fornecido pela empresa',
  'Administração', 'Santos', 'ONSITE', 'CLT', 'INTERN', 900, 1100, 0, true, -23.9608, -46.3336, now() - interval '1 day', now() - interval '1 day', now()
FROM "CompanyProfile" c JOIN "User" u ON u."id" = c."userId" WHERE u."email" = 'ancora@demo.nautiwork.test'
ON CONFLICT ("id") DO NOTHING;

-- Vaga exclusiva PcD (Farol Saúde, São Paulo)
INSERT INTO "Job" ("id", "companyId", "title", "description", "responsibilities", "requirements", "benefits", "area", "location", "workMode", "contractType", "seniority", "salaryMin", "salaryMax", "minYears", "pcdOnly", "lat", "lng", "publishedAt", "confirmedAt", "updatedAt")
SELECT 'demo_job_pcd', c."id", 'Assistente Administrativo (vaga PcD)', 'Vaga fictícia de demonstração, exclusiva para pessoas com deficiência. Posto com acessibilidade e software leitor de tela disponível.',
  'Agendar consultas, organizar planilhas e responder pacientes por e-mail.', 'Ensino médio completo. Excel básico.', 'Vale-refeição, plano de saúde e horário flexível',
  'Administração', 'São Paulo', 'HYBRID', 'CLT', 'JUNIOR', 2100, 2500, 0, true, -23.5505, -46.6333, now() - interval '2 days', now() - interval '2 days', now()
FROM "CompanyProfile" c JOIN "User" u ON u."id" = c."userId" WHERE u."email" = 'farol@demo.nautiwork.test'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "JobSkill" ("jobId", "skillId")
SELECT j."id", s."id" FROM "Job" j JOIN "Skill" s ON s."name" IN ('Excel', 'Organização') WHERE j."id" = 'demo_job_aprendiz'
UNION ALL
SELECT j."id", s."id" FROM "Job" j JOIN "Skill" s ON s."name" IN ('Excel', 'Comunicação') WHERE j."id" = 'demo_job_pcd'
ON CONFLICT DO NOTHING;

-- Ana: Git comprovado por prova, projeto confirmado pela professora e CEP de casa
INSERT INTO "SkillCheck" ("id", "candidateId", "skill", "questionIds", "score", "total", "passed", "startedAt", "finishedAt")
SELECT 'demo_check_ana_git', cp."id", 'git', ARRAY['git-1:0123', 'git-2:1302', 'git-3:2013', 'git-4:3120', 'git-5:0231'], 5, 5, true, now() - interval '3 days' - interval '6 minutes', now() - interval '3 days'
FROM "CandidateProfile" cp JOIN "User" u ON u."id" = cp."userId" WHERE u."email" = 'ana@demo.nautiwork.test'
ON CONFLICT ("id") DO NOTHING;

UPDATE "CandidateSkill" cs SET "verifiedAt" = now() - interval '3 days'
FROM "CandidateProfile" cp, "User" u, "Skill" s
WHERE cs."candidateId" = cp."id" AND u."id" = cp."userId" AND s."id" = cs."skillId" AND u."email" = 'ana@demo.nautiwork.test' AND s."name" = 'Git' AND cs."verifiedAt" IS NULL;

INSERT INTO "Project" ("id", "candidateId", "title", "description", "url", "school", "teacherName", "teacherEmail", "validatedAt", "validatorNote", "createdAt")
SELECT 'demo_proj_ana', cp."id", 'Mural de vagas da escola', 'Site em React para a coordenação publicar vagas de estágio para os alunos. Fiz o front-end e a busca por curso.', NULL,
  'Escola Técnica Demo', 'Profa. Helena Rocha', 'helena.rocha@demo.nautiwork.test', now() - interval '5 days', 'Projeto fictício de demonstração. A aluna conduziu o front-end do começo ao fim.', now() - interval '6 days'
FROM "CandidateProfile" cp JOIN "User" u ON u."id" = cp."userId" WHERE u."email" = 'ana@demo.nautiwork.test'
ON CONFLICT ("id") DO NOTHING;

UPDATE "CandidateProfile" cp SET "postalCode" = '50030230', "lat" = -8.0631, "lng" = -34.8711
FROM "User" u WHERE u."id" = cp."userId" AND u."email" = 'ana@demo.nautiwork.test' AND cp."postalCode" IS NULL;

-- Ana: candidatura recusada com motivo e habilidade a desenvolver (Tridente Finanças)
INSERT INTO "JobApplication" ("id", "jobId", "candidateId", "status", "compatibility", "rejectReason", "rejectSkills", "createdAt", "updatedAt")
SELECT 'demo_app_ana_rejected', j."id", cp."id", 'REJECTED', 70, 'SKILLS', ARRAY['React Native'], now() - interval '9 days', now() - interval '4 days'
FROM "Job" j JOIN "CompanyProfile" c ON c."id" = j."companyId" JOIN "User" cu ON cu."id" = c."userId",
  "CandidateProfile" cp JOIN "User" u ON u."id" = cp."userId"
WHERE cu."email" = 'tridente@demo.nautiwork.test' AND j."title" LIKE '%React Native%' AND u."email" = 'ana@demo.nautiwork.test'
ON CONFLICT DO NOTHING;

INSERT INTO "ApplicationStatusHistory" ("id", "applicationId", "status", "createdAt")
SELECT 'demo_hist_ana_rej_1', a."id", 'SUBMITTED'::"ApplicationStatus", now() - interval '9 days' FROM "JobApplication" a WHERE a."id" = 'demo_app_ana_rejected'
UNION ALL
SELECT 'demo_hist_ana_rej_2', a."id", 'REJECTED'::"ApplicationStatus", now() - interval '4 days' FROM "JobApplication" a WHERE a."id" = 'demo_app_ana_rejected'
ON CONFLICT ("id") DO NOTHING;

-- Bruno: SQL comprovado e projeto ainda esperando o professor
INSERT INTO "SkillCheck" ("id", "candidateId", "skill", "questionIds", "score", "total", "passed", "startedAt", "finishedAt")
SELECT 'demo_check_bruno_sql', cp."id", 'sql', ARRAY['sql-1:0123', 'sql-2:1302', 'sql-3:2013', 'sql-4:3120', 'sql-5:0231'], 4, 5, true, now() - interval '2 days' - interval '8 minutes', now() - interval '2 days'
FROM "CandidateProfile" cp JOIN "User" u ON u."id" = cp."userId" WHERE u."email" = 'bruno@demo.nautiwork.test'
ON CONFLICT ("id") DO NOTHING;

UPDATE "CandidateSkill" cs SET "verifiedAt" = now() - interval '2 days'
FROM "CandidateProfile" cp, "User" u, "Skill" s
WHERE cs."candidateId" = cp."id" AND u."id" = cp."userId" AND s."id" = cs."skillId" AND u."email" = 'bruno@demo.nautiwork.test' AND s."name" = 'SQL' AND cs."verifiedAt" IS NULL;

INSERT INTO "Project" ("id", "candidateId", "title", "description", "school", "teacherName", "teacherEmail", "createdAt")
SELECT 'demo_proj_bruno', cp."id", 'Painel de frequência da turma', 'Painel em Python que lê a planilha de chamada e mostra faltas por aluno e por matéria.',
  'Escola Técnica Demo', 'Prof. Ricardo Alves', 'ricardo.alves@demo.nautiwork.test', now() - interval '1 day'
FROM "CandidateProfile" cp JOIN "User" u ON u."id" = cp."userId" WHERE u."email" = 'bruno@demo.nautiwork.test'
ON CONFLICT ("id") DO NOTHING;

-- Carla: contratada pela Farol Saúde há 31 dias, com o acompanhamento de 30 dias pendente para os dois lados
UPDATE "JobApplication" a SET "status" = 'APPROVED', "hiredAt" = now() - interval '31 days'
FROM "CandidateProfile" cp, "User" u, "Job" j, "CompanyProfile" c, "User" cu
WHERE a."candidateId" = cp."id" AND u."id" = cp."userId" AND j."id" = a."jobId" AND c."id" = j."companyId" AND cu."id" = c."userId"
  AND u."email" = 'carla@demo.nautiwork.test' AND cu."email" = 'farol@demo.nautiwork.test' AND a."hiredAt" IS NULL;

INSERT INTO "ApplicationStatusHistory" ("id", "applicationId", "status", "createdAt")
SELECT 'demo_hist_carla_ok', a."id", 'APPROVED', now() - interval '31 days'
FROM "JobApplication" a JOIN "CandidateProfile" cp ON cp."id" = a."candidateId" JOIN "User" u ON u."id" = cp."userId"
WHERE u."email" = 'carla@demo.nautiwork.test' AND a."status" = 'APPROVED'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "HireCheckin" ("id", "applicationId", "candidateId", "day", "role", "createdAt")
SELECT 'demo_ck_carla_' || r.role, a."id", a."candidateId", 30, r.role::"Role", now() - interval '1 day'
FROM "JobApplication" a JOIN "CandidateProfile" cp ON cp."id" = a."candidateId" JOIN "User" u ON u."id" = cp."userId",
  (VALUES ('CANDIDATE'), ('COMPANY')) AS r(role)
WHERE u."email" = 'carla@demo.nautiwork.test' AND a."status" = 'APPROVED' AND a."hiredAt" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Marés Tecnologia: números para a estimativa de cotas (sem CNPJ: empresa fictícia não ganha selo)
UPDATE "CompanyProfile" c SET "companySize" = 'MEDIUM', "employees" = 120, "apprentices" = 2, "pcdEmployees" = 1
FROM "User" u WHERE u."id" = c."userId" AND u."email" = 'mares@demo.nautiwork.test' AND c."employees" IS NULL;
