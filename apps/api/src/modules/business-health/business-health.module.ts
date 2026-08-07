import { Module } from '@nestjs/common';
import { BusinessHealthService } from './business-health.service';

@Module({
  providers: [BusinessHealthService],
  exports: [BusinessHealthService],
})
export class BusinessHealthModule {}
