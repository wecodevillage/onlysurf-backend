import { Module } from '@nestjs/common';
import { SavedWavesController } from './saved-waves.controller';
import { SavedWavesService } from './saved-waves.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [SavedWavesController],
  providers: [SavedWavesService],
  exports: [SavedWavesService],
})
export class SavedWavesModule {}
