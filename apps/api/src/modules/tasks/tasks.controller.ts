import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../../common/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';
import { TenantScopeService } from '../../common/tenant-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
@Roles('client')
export class TasksController {
  constructor(private prisma: PrismaService, private tenant: TenantScopeService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const company = await this.tenant.requireOwnCompany(user.sub, user.companyId);
    return this.prisma.task.findMany({
      where: { companyId: company.id },
      orderBy: [{ done: 'asc' }, { priority: 'asc' }, { createdAt: 'asc' }],
    });
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    const company = await this.tenant.requireOwnCompany(user.sub, user.companyId);
    return this.prisma.task.create({ data: { ...dto, companyId: company.id } });
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const company = await this.tenant.requireOwnCompany(user.sub, user.companyId);
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Tarefa não encontrada.');
    if (task.companyId !== company.id) throw new ForbiddenException('Tarefa fora do escopo desta empresa.');
    return this.prisma.task.update({ where: { id }, data: { done: dto.done } });
  }
}
