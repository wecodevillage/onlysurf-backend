import { Module } from '@nestjs/common';
import { WavesController } from './waves.controller';
import { WavesService } from './waves.service';

@Module({
  controllers: [WavesController],
  providers: [WavesService],
  exports: [WavesService],
})
export class WavesModule {}
