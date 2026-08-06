import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../common/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('companies')
  async companies(@Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    const take = Math.min(Number(pageSize) || 20, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { subscriptions: { where: { status: { in: ['trialing', 'active'] } }, take: 1 } },
      }),
      this.prisma.company.count(),
    ]);
    return { items, total, page: Number(page) || 1, pageSize: take };
  }

  @Get('metrics')
  async metrics() {
    const activeSubs = await this.prisma.subscription.findMany({
      where: { status: 'active' },
      select: { valorMensal: true },
    });
    const mrr = activeSubs.reduce((sum, s) => sum + Number(s.valorMensal), 0);
    const arr = mrr * 12;

    const commissionsAgg = await this.prisma.commission.aggregate({ _sum: { valor: true } });
    const [companyCount, clientCount, repCount, pendingAudit] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count({ where: { role: 'client' } }),
      this.prisma.user.count({ where: { role: 'rep' } }),
      this.prisma.auditQueueItem.count({ where: { status: 'pending' } }),
    ]);

    return {
      mrr,
      arr,
      totalCommissions: Number(commissionsAgg._sum.valor ?? 0),
      companyCount,
      clientCount,
      repCount,
      pendingAuditCount: pendingAudit,
    };
  }

  @Get('audit-queue')
  async auditQueue(@Query('status') status?: string) {
    return this.prisma.auditQueueItem.findMany({
      where: status ? { status: status as any } : { status: 'pending' },
      include: {
        agentRun: { include: { agent: true, company: { select: { nome: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
