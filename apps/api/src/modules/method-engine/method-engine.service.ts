import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StepStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface ChecklistItem {
  txtPt: string;
  txtEn: string;
  done: boolean;
}

const TOTAL_STEPS = 7;

/**
 * 7M Engine — owns the client's journey through the Método 7M: checklist
 * completion drives step progress %, step completion auto-unlocks the next
 * step, and company.nivel7m tracks the current rung. This is the first of
 * the five "invisible" engines behind the product (the others: Business
 * Health, Next Best Action, Matching, Growth Intelligence).
 */
@Injectable()
export class MethodEngineService {
  constructor(private prisma: PrismaService) {}

  async toggleChecklistItem(companyId: string, stepN: number, itemIndex: number) {
    const progress = await this.prisma.companyStepProgress.findUnique({
      where: { companyId_stepN: { companyId, stepN } },
    });
    if (!progress) throw new NotFoundException('Etapa não encontrada para esta empresa.');
    if (progress.status === 'locked') {
      throw new ForbiddenException('Etapa bloqueada — conclua as etapas anteriores primeiro.');
    }

    const checklist = (progress.checklist as unknown as ChecklistItem[]) ?? [];
    const item = checklist[itemIndex];
    if (!item) throw new NotFoundException('Item de checklist não encontrado.');
    item.done = !item.done;

    const total = checklist.length;
    const doneCount = checklist.filter((c) => c.done).length;
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    const wasStarted = progress.startedAt !== null;
    const wasDone = progress.status === 'done';

    let status: StepStatus = progress.status;
    let completedAt: Date | null = progress.completedAt;
    let deadlinePt = progress.deadlinePt;
    let deadlineEn = progress.deadlineEn;
    if (pct === 100) {
      status = 'done';
      completedAt = completedAt ?? new Date();
      deadlinePt = 'Concluído';
      deadlineEn = 'Done';
    } else {
      status = pct === 0 ? 'next' : 'doing';
      completedAt = null;
      // Un-completing a step: restore a sensible in-progress label instead of leaving "Concluído".
      if (progress.status === 'done') {
        deadlinePt = pct === 0 ? 'pronto p/ iniciar' : 'em andamento';
        deadlineEn = pct === 0 ? 'ready to start' : 'in progress';
      }
    }

    const updated = await this.prisma.companyStepProgress.update({
      where: { companyId_stepN: { companyId, stepN } },
      data: {
        checklist: checklist as unknown as Prisma.InputJsonValue,
        pct,
        status,
        completedAt,
        deadlinePt,
        deadlineEn,
        startedAt: !wasStarted && pct > 0 ? new Date() : progress.startedAt,
      },
    });

    let unlocked: { n: number } | null = null;
    if (status === 'done' && !wasDone && stepN < TOTAL_STEPS) {
      const next = await this.prisma.companyStepProgress.findUnique({
        where: { companyId_stepN: { companyId, stepN: stepN + 1 } },
      });
      if (next && next.status === 'locked') {
        await this.prisma.companyStepProgress.update({
          where: { companyId_stepN: { companyId, stepN: stepN + 1 } },
          data: {
            status: 'next',
            deadlinePt: 'pronto p/ iniciar',
            deadlineEn: 'ready to start',
          },
        });
        unlocked = { n: stepN + 1 };
      }
    }

    await this.recomputeCompanyRung(companyId);

    return { step: updated, unlockedStepN: unlocked?.n ?? null };
  }

  /** company.nivel7m = highest completed rung + 1 (capped at 7), i.e. "the rung you're on now". */
  private async recomputeCompanyRung(companyId: string) {
    const doneSteps = await this.prisma.companyStepProgress.findMany({
      where: { companyId, status: 'done' },
      select: { stepN: true },
    });
    const highestDone = doneSteps.reduce((max, s) => Math.max(max, s.stepN), 0);
    const nivel7m = Math.min(TOTAL_STEPS, highestDone + 1);
    await this.prisma.company.update({ where: { id: companyId }, data: { nivel7m } });
  }
}
