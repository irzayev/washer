import { Module } from '@nestjs/common';
import { EvolutionService } from './evolution.service';
import { WhatsappController } from './whatsapp.controller';

@Module({
  providers: [EvolutionService],
  controllers: [WhatsappController],
  exports: [EvolutionService],
})
export class WhatsappModule {}
