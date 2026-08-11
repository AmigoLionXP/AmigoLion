import { Module } from '@nestjs/common';
import { AuditQueueController } from './audit-queue.controller';

@Module({
  controllers: [AuditQueueController],
})
export class AuditQueueModule {}
