import { Module } from '@nestjs/common';
import { InstagramController } from './instagram.controller';

@Module({
  controllers: [InstagramController],
})
export class InstagramModule {}
