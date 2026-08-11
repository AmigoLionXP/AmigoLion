import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessScanStepKey, IntegrationProvider, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantScopeService } from '../../common/tenant-scope.service';
import { MethodEngineService } from '../method-engine/method-engine.service';
import { BusinessHealthService } from '../business-health/business-health.service';
import { computeGrowthScore } from '../diagnostics/growth-score';
import { BUSINESS_SCAN_STEPS, getStepDef, mapDiagnosticarToRespostas } from './business-scan-schema';
import { validateSectionData, validateSkippedFields } from './business-scan-validation';

const STEP_ORDER: BusinessScanStepKey[] = BUSINESS_SCAN_STEPS.map((s) => s.key);

@Injectable()
export class BusinessScanService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantScopeService,
    private methodEngine: MethodEngineService,
    private businessHealth: BusinessHealthService,
  ) {}

  /** Idempotent — returns the existing scan for this tenant's company, creating one (with all 8 sections seeded `not_started`) on first call. */
  private async getOrCreateForCompany(companyId: string) {
    const existing = await this.prisma.businessScan.findUnique({ where: { companyId } });
    if (existing) return existing;

    return this.prisma.businessScan.create({
      data: {
        companyId,
        sections: { create: STEP_ORDER.map((stepKey) => ({ stepKey })) },
        integrations: {
          create: Array.from(new Set(BUSINESS_SCAN_STEPS.flatMap((s) => s.integrations))).map((provider) => ({
            provider,
          })),
        },
      },
    });
  }

  async getScan(userId: string, companyId?: string) {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const scan = await this.getOrCreateForCompany(company.id);
    const [sections, files, integrations] = await Promise.all([
      this.prisma.businessScanSection.findMany({ where: { businessScanId: scan.id } }),
      this.prisma.businessScanFile.findMany({ where: { businessScanId: scan.id }, orderBy: { uploadedAt: 'desc' } }),
      this.prisma.businessScanIntegration.findMany({ where: { businessScanId: scan.id } }),
    ]);

    return {
      id: scan.id,
      status: scan.status,
      currentStep: scan.currentStep,
      startedAt: scan.startedAt,
      completedAt: scan.completedAt,
      progressPct: this.computeProgress(sections, files),
      sections: sections.map((s) => ({
        stepKey: s.stepKey,
        status: s.status,
        data: s.data,
        skippedFields: s.skippedFields,
        updatedAt: s.updatedAt,
      })),
      files: files.map((f) => ({
        id: f.id,
        stepKey: f.stepKey,
        fieldKey: f.fieldKey,
        fileName: f.fileName,
        mimeType: f.mimeType,
        size: f.size,
        uploadedAt: f.uploadedAt,
      })),
      integrations: integrations.map((i) => ({ provider: i.provider, status: i.status, connectedAt: i.connectedAt })),
    };
  }

  private computeProgress(
    sections: { stepKey: BusinessScanStepKey; data: Prisma.JsonValue; skippedFields: Prisma.JsonValue }[],
    files: { stepKey: BusinessScanStepKey; fieldKey: string }[],
  ): number {
    let total = 0;
    let answered = 0;
    const filesByStep = new Map<string, Set<string>>();
    for (const f of files) {
      if (!filesByStep.has(f.stepKey)) filesByStep.set(f.stepKey, new Set());
      filesByStep.get(f.stepKey)!.add(f.fieldKey);
    }
    const sectionByStep = new Map(sections.map((s) => [s.stepKey, s]));

    for (const step of BUSINESS_SCAN_STEPS) {
      const section = sectionByStep.get(step.key);
      const data = (section?.data as Record<string, unknown>) ?? {};
      const skipped = new Set(((section?.skippedFields as string[]) ?? []) as string[]);
      const uploadedKeys = filesByStep.get(step.key) ?? new Set<string>();

      total += step.fields.length + step.uploads.length;
      for (const f of step.fields) {
        if (skipped.has(f.key) || (data[f.key] !== undefined && data[f.key] !== null && data[f.key] !== '')) answered += 1;
      }
      for (const u of step.uploads) {
        if (skipped.has(u.key) || uploadedKeys.has(u.key)) answered += 1;
      }
    }
    return total > 0 ? Math.round((answered / total) * 100) : 0;
  }

  async saveSection(
    userId: string,
    companyId: string | undefined,
    stepKey: BusinessScanStepKey,
    data: Record<string, unknown>,
    skippedFields: unknown,
  ) {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const scan = await this.getOrCreateForCompany(company.id);
    const cleanData = validateSectionData(stepKey, data ?? {});
    const cleanSkipped = validateSkippedFields(stepKey, skippedFields);

    const existing = await this.prisma.businessScanSection.findUniqueOrThrow({
      where: { businessScanId_stepKey: { businessScanId: scan.id, stepKey } },
    });
    const mergedData = { ...(existing.data as Record<string, unknown>), ...cleanData };
    const mergedSkipped = Array.from(new Set([...(existing.skippedFields as string[]), ...cleanSkipped]));

    const section = await this.prisma.businessScanSection.update({
      where: { businessScanId_stepKey: { businessScanId: scan.id, stepKey } },
      data: {
        data: mergedData as unknown as Prisma.InputJsonValue,
        skippedFields: mergedSkipped as unknown as Prisma.InputJsonValue,
        status: existing.status === 'completed' ? 'completed' : 'in_progress',
      },
    });

    if (scan.status === 'not_started') {
      await this.prisma.businessScan.update({
        where: { id: scan.id },
        data: { status: 'in_progress', startedAt: scan.startedAt ?? new Date() },
      });
    }

    return section;
  }

  async completeSection(userId: string, companyId: string | undefined, stepKey: BusinessScanStepKey) {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const scan = await this.getOrCreateForCompany(company.id);
    const section = await this.prisma.businessScanSection.update({
      where: { businessScanId_stepKey: { businessScanId: scan.id, stepKey } },
      data: { status: 'completed' },
    });

    const idx = STEP_ORDER.indexOf(stepKey);
    const next = STEP_ORDER[idx + 1];
    if (next && scan.currentStep === stepKey) {
      await this.prisma.businessScan.update({ where: { id: scan.id }, data: { currentStep: next } });
    }

    return section;
  }

  /**
   * Finalizes the Business Scan — the moment the company's "Digital DNA" starts
   * actually feeding the rest of the product: bridges the Diagnosticar section's
   * 1-10 ratings into a real Diagnostic (status=complete), which unlocks the
   * Método 7M gate; initializes the 7-step journey; and recomputes the Business
   * Health score so it isn't just a promise in a completion screen.
   */
  async completeScan(userId: string, companyId?: string) {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const scan = await this.getOrCreateForCompany(company.id);
    if (scan.status === 'completed') {
      return this.getScan(userId, company.id);
    }

    const diagnosticarSection = await this.prisma.businessScanSection.findUnique({
      where: { businessScanId_stepKey: { businessScanId: scan.id, stepKey: 'diagnosticar' } },
    });
    const respostas = mapDiagnosticarToRespostas((diagnosticarSection?.data as Record<string, unknown>) ?? {});
    const growthScore = computeGrowthScore(respostas);
    const gargalo = (diagnosticarSection?.data as Record<string, unknown> | undefined)?.maiorDesafio as
      | string
      | undefined;

    await this.prisma.$transaction([
      this.prisma.businessScan.update({
        where: { id: scan.id },
        data: { status: 'completed', completedAt: new Date() },
      }),
      this.prisma.diagnostic.create({
        data: {
          companyId: company.id,
          gargalo: gargalo ?? null,
          respostas: respostas as unknown as Prisma.InputJsonValue,
          growthScore,
          status: 'complete',
        },
      }),
      this.prisma.company.update({ where: { id: company.id }, data: { growthScore } }),
    ]);

    await this.methodEngine.initializeJourney(
      company.id,
      'Business Scan concluído — DNA Digital criado',
      'Business Scan completed — Digital DNA created',
    );
    const { score } = await this.businessHealth.recomputeAndPersist(company.id, 'business_scan_completed');

    return { ...(await this.getScan(userId, company.id)), growthScore: score };
  }

  async connectIntegration(userId: string, companyId: string | undefined, provider: IntegrationProvider) {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const scan = await this.getOrCreateForCompany(company.id);
    // No real OAuth flow exists yet for any provider — this marks the intent so the
    // architecture (schema + endpoint) is ready to swap in a real provider-specific
    // flow later without changing the API shape the frontend already calls.
    return this.prisma.businessScanIntegration.upsert({
      where: { businessScanId_provider: { businessScanId: scan.id, provider } },
      update: { status: 'pending' },
      create: { businessScanId: scan.id, provider, status: 'pending' },
    });
  }

  async uploadFile(
    userId: string,
    companyId: string | undefined,
    stepKey: BusinessScanStepKey,
    fieldKey: string,
    file: { originalname: string; mimetype: string; size: number; path: string },
  ) {
    const step = getStepDef(stepKey);
    if (!step.uploads.some((u) => u.key === fieldKey)) {
      throw new BadRequestException(`Campo de upload inválido para esta etapa: ${fieldKey}`);
    }
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const scan = await this.getOrCreateForCompany(company.id);
    return this.prisma.businessScanFile.create({
      data: {
        businessScanId: scan.id,
        stepKey,
        fieldKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: file.path,
      },
    });
  }

  async getFileForDownload(userId: string, companyId: string | undefined, fileId: string) {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const scan = await this.getOrCreateForCompany(company.id);
    const file = await this.prisma.businessScanFile.findUnique({ where: { id: fileId } });
    if (!file || file.businessScanId !== scan.id) throw new NotFoundException('Arquivo não encontrado.');
    return file;
  }

  async deleteFile(userId: string, companyId: string | undefined, fileId: string) {
    const file = await this.getFileForDownload(userId, companyId, fileId);
    await this.prisma.businessScanFile.delete({ where: { id: file.id } });
    return file;
  }
}
