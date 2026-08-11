-- CreateEnum
CREATE TYPE "Role" AS ENUM ('public', 'client', 'rep', 'admin');

-- CreateEnum
CREATE TYPE "DiagnosticStatus" AS ENUM ('partial', 'complete');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('done', 'doing', 'next', 'locked');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('comunit', 'connect', 'round', 'summit');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('scheduled', 'open', 'closed');

-- CreateEnum
CREATE TYPE "AgentRiskLevel" AS ENUM ('low', 'high');

-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('queued', 'processing', 'completed', 'needs_review');

-- CreateEnum
CREATE TYPE "AuditQueueStatus" AS ENUM ('pending', 'signed', 'rejected');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('high', 'medium');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'public',
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "cnpj" TEXT,
    "nome" TEXT NOT NULL,
    "setor" TEXT,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "faturamentoAnual" DECIMAL(14,2),
    "growthScore" INTEGER NOT NULL DEFAULT 0,
    "nivel7m" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostics" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "gargalo" TEXT,
    "respostas" JSONB NOT NULL DEFAULT '{}',
    "growthScore" INTEGER NOT NULL,
    "status" "DiagnosticStatus" NOT NULL DEFAULT 'partial',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "whatsapp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "method_steps" (
    "n" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "verbPt" TEXT NOT NULL,
    "verbEn" TEXT NOT NULL,
    "specialistRolePt" TEXT NOT NULL,
    "specialistRoleEn" TEXT NOT NULL,

    CONSTRAINT "method_steps_pkey" PRIMARY KEY ("n")
);

-- CreateTable
CREATE TABLE "company_step_progress" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "stepN" INTEGER NOT NULL,
    "pct" INTEGER NOT NULL DEFAULT 0,
    "status" "StepStatus" NOT NULL DEFAULT 'locked',
    "specialistName" TEXT,
    "deadlinePt" TEXT,
    "deadlineEn" TEXT,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_step_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "faixaFaturamento" TEXT,
    "city" TEXT,
    "uplineRepId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "valorMensal" DECIMAL(10,2) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "pct" DECIMAL(5,2) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "tipo" "EventType" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "faixa" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "titlePt" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "prazoPt" TEXT NOT NULL,
    "prazoEn" TEXT NOT NULL,
    "tempo" TEXT,
    "impactoPt" TEXT,
    "impactoEn" TEXT,
    "specialist" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "riskLevel" "AgentRiskLevel" NOT NULL DEFAULT 'low',
    "status" "AgentRunStatus" NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_queue" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "status" "AuditQueueStatus" NOT NULL DEFAULT 'pending',
    "specialistId" TEXT,
    "signatureHash" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "method_steps_code_key" ON "method_steps"("code");

-- CreateIndex
CREATE UNIQUE INDEX "company_step_progress_companyId_stepN_key" ON "company_step_progress"("companyId", "stepN");

-- CreateIndex
CREATE UNIQUE INDEX "reps_userId_key" ON "reps"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_companyId_repId_key" ON "memberships"("companyId", "repId");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_subscriptionId_repId_mesReferencia_key" ON "commissions"("subscriptionId", "repId", "mesReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "agents_key_key" ON "agents"("key");

-- CreateIndex
CREATE UNIQUE INDEX "audit_queue_agentRunId_key" ON "audit_queue"("agentRunId");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "diagnostics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_step_progress" ADD CONSTRAINT "company_step_progress_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_step_progress" ADD CONSTRAINT "company_step_progress_stepN_fkey" FOREIGN KEY ("stepN") REFERENCES "method_steps"("n") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reps" ADD CONSTRAINT "reps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reps" ADD CONSTRAINT "reps_uplineRepId_fkey" FOREIGN KEY ("uplineRepId") REFERENCES "reps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_repId_fkey" FOREIGN KEY ("repId") REFERENCES "reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_repId_fkey" FOREIGN KEY ("repId") REFERENCES "reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_repId_fkey" FOREIGN KEY ("repId") REFERENCES "reps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_queue" ADD CONSTRAINT "audit_queue_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_queue" ADD CONSTRAINT "audit_queue_specialistId_fkey" FOREIGN KEY ("specialistId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
