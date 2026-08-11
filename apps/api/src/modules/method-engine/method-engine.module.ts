import { Module } from '@nestjs/common';
import { MethodEngineService } from './method-engine.service';

@Module({
  providers: [MethodEngineService],
  exports: [MethodEngineService],
})
export class MethodEngineModule {}
