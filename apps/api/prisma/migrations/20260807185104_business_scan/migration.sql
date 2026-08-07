-- CreateEnum
CREATE TYPE "BusinessScanStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "BusinessScanStepKey" AS ENUM ('identificacao', 'diagnosticar', 'qualificar', 'organizar', 'crescer', 'capitalizar', 'escalar', 'valorizar');

-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('erp', 'crm', 'contabilidade', 'marketing', 'open_banking', 'google', 'meta', 'stripe', 'whatsapp');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('not_connected', 'pending', 'connected');

-- CreateTable
CREATE TABLE "business_scans" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "BusinessScanStatus" NOT NULL DEFAULT 'not_started',
    "currentStep" "BusinessScanStepKey" NOT NULL DEFAULT 'identificacao',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_scan_sections" (
    "id" TEXT NOT NULL,
    "businessScanId" TEXT NOT NULL,
    "stepKey" "BusinessScanStepKey" NOT NULL,
    "status" "BusinessScanStatus" NOT NULL DEFAULT 'not_started',
    "data" JSONB NOT NULL DEFAULT '{}',
    "skippedFields" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_scan_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_scan_files" (
    "id" TEXT NOT NULL,
    "businessScanId" TEXT NOT NULL,
    "stepKey" "BusinessScanStepKey" NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_scan_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_scan_integrations" (
    "id" TEXT NOT NULL,
    "businessScanId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'not_connected',
    "connectedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_scan_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_scans_companyId_key" ON "business_scans"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "business_scan_sections_businessScanId_stepKey_key" ON "business_scan_sections"("businessScanId", "stepKey");

-- CreateIndex
CREATE UNIQUE INDEX "business_scan_integrations_businessScanId_provider_key" ON "business_scan_integrations"("businessScanId", "provider");

-- AddForeignKey
ALTER TABLE "business_scans" ADD CONSTRAINT "business_scans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_scan_sections" ADD CONSTRAINT "business_scan_sections_businessScanId_fkey" FOREIGN KEY ("businessScanId") REFERENCES "business_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_scan_files" ADD CONSTRAINT "business_scan_files_businessScanId_fkey" FOREIGN KEY ("businessScanId") REFERENCES "business_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_scan_integrations" ADD CONSTRAINT "business_scan_integrations_businessScanId_fkey" FOREIGN KEY ("businessScanId") REFERENCES "business_scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
