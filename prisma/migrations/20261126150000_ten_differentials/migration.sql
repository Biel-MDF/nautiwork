-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "whatsapp" TEXT,
ADD COLUMN     "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CandidateSkill" ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "apprentices" INTEGER,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "cnpjVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "companySize" TEXT,
ADD COLUMN     "employees" INTEGER,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "pcdEmployees" INTEGER;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "forApprentice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "pcdOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postalCode" TEXT;

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "hiredAt" TIMESTAMP(3),
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "rejectSkills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "SkillCheck" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "questionIds" TEXT[],
    "score" INTEGER,
    "total" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "SkillCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "school" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "teacherEmail" TEXT NOT NULL,
    "tokenHash" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HireCheckin" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "score" INTEGER,
    "wantsTalk" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "HireCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobReport" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillCheck_candidateId_skill_startedAt_idx" ON "SkillCheck"("candidateId", "skill", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_tokenHash_key" ON "Project"("tokenHash");

-- CreateIndex
CREATE INDEX "Project_candidateId_idx" ON "Project"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "HireCheckin_applicationId_day_role_key" ON "HireCheckin"("applicationId", "day", "role");

-- CreateIndex
CREATE UNIQUE INDEX "JobReport_jobId_userId_key" ON "JobReport"("jobId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_cnpj_key" ON "CompanyProfile"("cnpj");

-- AddForeignKey
ALTER TABLE "SkillCheck" ADD CONSTRAINT "SkillCheck_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireCheckin" ADD CONSTRAINT "HireCheckin_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireCheckin" ADD CONSTRAINT "HireCheckin_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Dados de demonstração: coordenadas aproximadas do centro de cada cidade, só para as
-- vagas das empresas [Demo], para a estimativa de deslocamento funcionar na apresentação.
UPDATE "Job" j SET "lat" = c.lat, "lng" = c.lng
FROM (VALUES
  ('São Paulo', -23.5505, -46.6333), ('Recife', -8.0476, -34.8770), ('Santos', -23.9608, -46.3336),
  ('Belo Horizonte', -19.9167, -43.9345), ('Curitiba', -25.4284, -49.2733), ('Fortaleza', -3.7319, -38.5267),
  ('Porto Alegre', -30.0346, -51.2177)
) AS c(city, lat, lng), "CompanyProfile" cp, "User" u
WHERE j."companyId" = cp."id" AND cp."userId" = u."id" AND u."email" LIKE '%@demo.nautiwork.test'
  AND j."location" = c.city AND j."lat" IS NULL;
