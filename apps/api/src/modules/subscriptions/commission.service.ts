import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantScopeService } from '../../common/tenant-scope.service';

const MAX_OVERRIDE_PCT = Number(process.env.COMMISSION_MAX_OVERRIDE_PCT ?? 28);

/**
 * Override empilhado (backend_contract.md, regras 1-2):
 * each rep in the upline chain above the client's rep earns a slice sized by
 * their own rung (7M1=1% … 7M7=7%), capped so the chain never exceeds 28%.
 */
@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService, private tenant: TenantScopeService) {}

  async computeAndPersist(subscriptionId: string, mesReferencia: string) {
    const subscription = await this.prisma.subscription.findUniqueOrThrow({
      where: { id: subscriptionId },
    });
    const membership = await this.prisma.membership.findFirst({
      where: { companyId: subscription.companyId },
      orderBy: { createdAt: 'asc' },
    });
    if (!membership) return [];

    const chain = await this.tenant.uplineChain(membership.repId);

    let cumulative = 0;
    const rows: { repId: string; nivel: number; pct: number; valor: number }[] = [];
    for (const rep of chain) {
      if (cumulative >= MAX_OVERRIDE_PCT) break;
      const pct = Math.min(rep.nivel, MAX_OVERRIDE_PCT - cumulative);
      if (pct <= 0) break;
      cumulative += pct;
      const valor = Number(subscription.valorMensal) * (pct / 100);
      rows.push({ repId: rep.id, nivel: rep.nivel, pct, valor });
    }

    await this.prisma.$transaction(
      rows.map((r) =>
        this.prisma.commission.upsert({
          where: {
            subscriptionId_repId_mesReferencia: {
              subscriptionId,
              repId: r.repId,
              mesReferencia,
            },
          },
          create: {
            subscriptionId,
            repId: r.repId,
            nivel: r.nivel,
            pct: r.pct,
            valor: r.valor,
            mesReferencia,
          },
          update: { pct: r.pct, valor: r.valor },
        }),
      ),
    );

    return rows;
  }
}
