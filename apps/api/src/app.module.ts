import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { DiagnosticsModule } from './modules/diagnostics/diagnostics.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CompanyModule } from './modules/company/company.module';
import { NetworkModule } from './modules/network/network.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AgentsModule } from './modules/agents/agents.module';
import { AuditQueueModule } from './modules/audit-queue/audit-queue.module';
import { AdminModule } from './modules/admin/admin.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    SubscriptionsModule,
    AuthModule,
    DiagnosticsModule,
    LeadsModule,
    CompanyModule,
    NetworkModule,
    TasksModule,
    AgentsModule,
    AuditQueueModule,
    AdminModule,
  ],
})
export class AppModule {}
