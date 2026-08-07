import { Injectable, NotFoundException } from '@nestjs/common';
import { MethodStep, CompanyStepProgress } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantScopeService } from '../../common/tenant-scope.service';
import { MethodEngineService } from '../method-engine/method-engine.service';

export interface MethodStepDto {
  n: number;
  code: string;
  verbPt: string;
  verbEn: string;
  specialistRolePt: string;
  specialistRoleEn: string;
  pct: number;
  status: string;
  specialistName: string | null;
  deadlinePt: string | null;
  deadlineEn: string | null;
  checklist: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
}

/** Joins the static step definition with a company's progress row into the DTO the frontend expects. */
function toStepDto(step: MethodStep, p: CompanyStepProgress | null): MethodStepDto {
  return {
    n: step.n,
    code: step.code,
    verbPt: step.verbPt,
    verbEn: step.verbEn,
    specialistRolePt: step.specialistRolePt,
    specialistRoleEn: step.specialistRoleEn,
    pct: p?.pct ?? 0,
    status: p?.status ?? 'locked',
    specialistName: p?.specialistName ?? null,
    deadlinePt: p?.deadlinePt ?? null,
    deadlineEn: p?.deadlineEn ?? null,
    checklist: p?.checklist ?? [],
    startedAt: p?.startedAt ?? null,
    completedAt: p?.completedAt ?? null,
  };
}

@Injectable()
export class CompanyService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantScopeService,
    private methodEngine: MethodEngineService,
  ) {}

  async getMyCompany(userId: string, companyId?: string) {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const [latestDiagnostic, activeSubscription, membership] = await Promise.all([
      this.prisma.diagnostic.findFirst({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.findFirst({
        where: { companyId: company.id, status: { in: ['trialing', 'active'] } },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.membership.findFirst({
        where: { companyId: company.id },
        include: { rep: { include: { user: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      ...company,
      diagnosticStatus: latestDiagnostic?.status ?? null,
      gargalo: latestDiagnostic?.gargalo ?? null,
      subscription: activeSubscription,
      manager: membership
        ? { id: membership.rep.id, name: membership.rep.user.name, nivel: membership.rep.nivel }
        : null,
    };
  }

  async getMySteps(userId: string, companyId?: string) {
    const company = await this.tenant.requireOwnCompany(userId, companyId);

    const completedDiagnostic = await this.prisma.diagnostic.findFirst({
      where: { companyId: company.id, status: 'complete' },
    });
    if (!completedDiagnostic) {
      return { gated: true as const, reason: 'diagnostics.status must be complete', steps: [] as MethodStepDto[] };
    }

    const steps = await this.prisma.methodStep.findMany({
      orderBy: { n: 'asc' },
      include: {
        progress: { where: { companyId: company.id } },
      },
    });

    return {
      gated: false as const,
      steps: steps.map((s) => toStepDto(s, s.progress[0] ?? null)),
    };
  }

  async getStep(userId: string, companyId: string | undefined, n: number) {
    const result = await this.getMySteps(userId, companyId);
    if (result.gated) return result;
    const step = result.steps.find((s) => s.n === n);
    if (!step) throw new NotFoundException('Etapa não encontrada.');
    return { gated: false, step };
  }

  async toggleChecklistItem(userId: string, companyId: string | undefined, stepN: number, itemIndex: number) {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const { step: progress, unlockedStepN } = await this.methodEngine.toggleChecklistItem(
      company.id,
      stepN,
      itemIndex,
    );
    const methodStep = await this.prisma.methodStep.findUniqueOrThrow({ where: { n: stepN } });
    return { step: toStepDto(methodStep, progress), unlockedStepN };
  }
}
