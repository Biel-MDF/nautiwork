-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiredAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "noReplyNotifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ResumeView" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "firstAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeView_candidateId_lastAt_idx" ON "ResumeView"("candidateId", "lastAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeView_candidateId_companyId_key" ON "ResumeView"("candidateId", "companyId");

-- CreateIndex
CREATE INDEX "Job_status_confirmedAt_idx" ON "Job"("status", "confirmedAt");

-- AddForeignKey
ALTER TABLE "ResumeView" ADD CONSTRAINT "ResumeView_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeView" ADD CONSTRAINT "ResumeView_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
