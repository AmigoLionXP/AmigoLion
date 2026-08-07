-- CreateTable
CREATE TABLE "growth_score_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "factors" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "growth_score_snapshots_companyId_createdAt_idx" ON "growth_score_snapshots"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "growth_score_snapshots" ADD CONSTRAINT "growth_score_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
