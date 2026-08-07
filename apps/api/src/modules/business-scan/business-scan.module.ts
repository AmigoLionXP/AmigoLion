import { Module } from '@nestjs/common';
import { BusinessScanController } from './business-scan.controller';
import { BusinessScanService } from './business-scan.service';
import { MethodEngineModule } from '../method-engine/method-engine.module';
import { BusinessHealthModule } from '../business-health/business-health.module';

@Module({
  imports: [MethodEngineModule, BusinessHealthModule],
  controllers: [BusinessScanController],
  providers: [BusinessScanService],
})
export class BusinessScanModule {}
