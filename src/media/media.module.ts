import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MuxService } from './mux.service';

@Module({
  controllers: [MediaController],
  providers: [MuxService],
  exports: [MuxService],
})
export class MediaModule {}
