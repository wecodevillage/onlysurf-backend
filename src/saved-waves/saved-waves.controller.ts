import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SavedWavesService } from './saved-waves.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

class SaveWaveDto {
  waveId: string;
}

@ApiTags('Saved Waves')
@ApiBearerAuth('firebase-auth')
@Controller('saved-waves')
export class SavedWavesController {
  constructor(private savedWavesService: SavedWavesService) {}

  @Post()
  @ApiOperation({
    summary: 'Save wave',
    description: 'Save a wave to athlete personal archive (Pro plan required)',
  })
  @ApiBody({ type: SaveWaveDto })
  @ApiResponse({ status: 201, description: 'Wave saved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires Pro Surfer plan',
  })
  async saveWave(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SaveWaveDto,
  ) {
    const savedWave = await this.savedWavesService.saveWave(
      user.id,
      dto.waveId,
    );
    return { savedWave };
  }

  @Get()
  @ApiOperation({
    summary: 'List saved waves',
    description: 'Retrieve all waves in athlete personal archive',
  })
  @ApiResponse({
    status: 200,
    description: 'Saved waves retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    const savedWaves = await this.savedWavesService.findAll(user.id);
    return { savedWaves };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete saved wave',
    description: 'Remove wave from personal archive',
  })
  @ApiParam({ name: 'id', description: 'Saved wave ID' })
  @ApiResponse({ status: 200, description: 'Saved wave deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Saved wave not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.savedWavesService.delete(id, user.id);
    return result;
  }
}
