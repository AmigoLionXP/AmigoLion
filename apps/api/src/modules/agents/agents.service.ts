import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantScopeService } from '../../common/tenant-scope.service';
import { AgentProvider } from './agent-provider.interface';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';

const REGULATED_SERVICE_LABEL = 'serviço regulado (contábil/jurídico/capital)';

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private tenant: TenantScopeService,
    private provider: AgentProvider,
  ) {}

  private async ensureAgent(key: string) {
    return this.prisma.agent.upsert({
      where: { key },
      update: {},
      create: { key, name: key === '7m-ai' ? '7M AI' : key },
    });
  }

  async createRun(userId: string, companyId: string | undefined, dto: CreateAgentRunDto) {
    const company = await this.tenant.requireOwnCompany(userId, companyId);
    const agentKey = dto.agentKey ?? '7m-ai';
    const agent = await this.ensureAgent(agentKey);

    const output = await this.provider.run({
      agentKey,
      companyId: company.id,
      message: dto.message,
      context: dto.context ?? {},
      lang: dto.lang ?? 'pt',
    });

    // Pipeline de auditoria: baixo risco processa em lote (aqui: imediato);
    // alto risco entra na audit_queue para validação humana obrigatória.
    const run = await this.prisma.agentRun.create({
      data: {
        agentId: agent.id,
        companyId: company.id,
        userId,
        input: { message: dto.message, context: dto.context ?? {} } as Prisma.InputJsonValue,
        output: { reply: output.reply },
        riskLevel: output.riskLevel,
        status: output.riskLevel === 'high' ? 'needs_review' : 'completed',
        completedAt: output.riskLevel === 'high' ? null : new Date(),
      },
    });

    if (output.riskLevel === 'high') {
      await this.prisma.auditQueueItem.create({ data: { agentRunId: run.id } });
    }

    return {
      ...run,
      note: output.riskLevel === 'high' ? `Enviado para validação humana — ${REGULATED_SERVICE_LABEL}.` : null,
    };
  }
}
