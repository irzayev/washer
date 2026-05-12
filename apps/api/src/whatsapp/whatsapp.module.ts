import { Module } from '@nestjs/common';
import { EvolutionService } from './evolution.service';
import { WhatsappController } from './whatsapp.controller';

@Module({
  controllers: [WhatsappController],
  providers: [EvolutionService],
  exports: [EvolutionService],
})
export class WhatsappModule {}
