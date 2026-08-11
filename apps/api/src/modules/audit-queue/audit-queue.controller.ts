import { Body, Controller, NotFoundException, Param, Patch } from '@nestjs/common';
import { Roles } from '../../common/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { SignAuditItemDto } from './dto/sign-audit-item.dto';

@Controller('audit-queue')
@Roles('admin')
export class AuditQueueController {
  constructor(private prisma: PrismaService) {}

  @Patch(':id/sign')
  async sign(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SignAuditItemDto) {
    const item = await this.prisma.auditQueueItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item de auditoria não encontrado.');

    const updated = await this.prisma.auditQueueItem.update({
      where: { id },
      data: {
        status: dto.decision,
        specialistId: user.sub,
        signatureHash: dto.signatureHash,
        signedAt: new Date(),
      },
    });

    await this.prisma.agentRun.update({
      where: { id: item.agentRunId },
      data: {
        status: dto.decision === 'signed' ? 'completed' : 'needs_review',
        completedAt: dto.decision === 'signed' ? new Date() : null,
      },
    });

    return updated;
  }
}
