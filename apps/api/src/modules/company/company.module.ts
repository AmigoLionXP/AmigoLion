import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { MethodEngineModule } from '../method-engine/method-engine.module';

@Module({
  imports: [MethodEngineModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
