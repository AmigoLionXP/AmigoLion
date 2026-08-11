import { Module } from '@nestjs/common';
import { BusinessScanController } from './business-scan.controller';
import { BusinessScanCopilotController } from './business-scan-copilot.controller';
import { BusinessScanService } from './business-scan.service';
import { BusinessScanCopilotService } from './business-scan-copilot.service';
import { MethodEngineModule } from '../method-engine/method-engine.module';
import { BusinessHealthModule } from '../business-health/business-health.module';

@Module({
  imports: [MethodEngineModule, BusinessHealthModule],
  controllers: [BusinessScanController, BusinessScanCopilotController],
  providers: [BusinessScanService, BusinessScanCopilotService],
})
export class BusinessScanModule {}
