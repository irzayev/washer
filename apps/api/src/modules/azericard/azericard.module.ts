import { Module } from '@nestjs/common';
import { AzericardController } from './azericard.controller';
import { AzericardService } from './azericard.service';

@Module({
  controllers: [AzericardController],
  providers: [AzericardService],
  exports: [AzericardService],
})
export class AzericardModule {}
