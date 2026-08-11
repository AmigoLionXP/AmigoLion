import { Global, Module } from '@nestjs/common';
import { CommissionService } from './commission.service';

@Global()
@Module({
  providers: [CommissionService],
  exports: [CommissionService],
})
export class SubscriptionsModule {}
