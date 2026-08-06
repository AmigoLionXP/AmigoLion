import { Body, Controller, ForbiddenException, Get, Post, Query } from '@nestjs/common';
import { Roles } from '../../common/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { TenantScopeService } from '../../common/tenant-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller()
@Roles('rep')
export class NetworkController {
  constructor(private prisma: PrismaService, private tenant: TenantScopeService) {}

  @Get('me/network')
  async network(@CurrentUser() user: AuthUser) {
    if (!user.repId) throw new ForbiddenException('Nenhum representante vinculado.');
    const ids = await this.tenant.downlineRepIds(user.repId);
    const downlineOnly = ids.filter((id) => id !== user.repId);
    return this.prisma.rep.findMany({
      where: { id: { in: downlineOnly } },
      include: {
        user: { select: { name: true, email: true } },
        memberships: { include: { company: { select: { id: true, nome: true, growthScore: true } } } },
      },
    });
  }

  @Get('me/commissions')
  async commissions(@CurrentUser() user: AuthUser, @Query('mes') mes?: string) {
    if (!user.repId) throw new ForbiddenException('Nenhum representante vinculado.');
    return this.prisma.commission.findMany({
      where: { repId: user.repId, ...(mes ? { mesReferencia: mes } : {}) },
      include: { subscription: { include: { company: { select: { nome: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('events')
  async createEvent(@CurrentUser() user: AuthUser, @Body() dto: CreateEventDto) {
    if (!user.repId) throw new ForbiddenException('Nenhum representante vinculado.');
    return this.prisma.event.create({ data: { ...dto, repId: user.repId } });
  }
}
