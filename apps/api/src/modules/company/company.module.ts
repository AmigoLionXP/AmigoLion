import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { MethodEngineModule } from '../method-engine/method-engine.module';
import { BusinessHealthModule } from '../business-health/business-health.module';

@Module({
  imports: [MethodEngineModule, BusinessHealthModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
