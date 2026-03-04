import { Module } from '@nestjs/common';
import { SavedWavesController } from './saved-waves.controller';
import { SavedWavesService } from './saved-waves.service';

@Module({
  controllers: [SavedWavesController],
  providers: [SavedWavesService],
  exports: [SavedWavesService],
})
export class SavedWavesModule {}
