import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WavesService } from './waves.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';

class CreateWaveDto {
  sessionId: string;
  academyId?: string;
  videoAssetId: string;
  title?: string;
  description?: string;
  startTime?: number;
  endTime?: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
}

class UpdateWaveDto {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
}

class TagAthleteDto {
  athleteId: string;
}

class AddScoreDto {
  score: number;
  category?: string;
}

class AddNoteDto {
  content: string;
}

@ApiTags('Waves')
@ApiBearerAuth('firebase-auth')
@Controller('waves')
export class WavesController {
  constructor(private wavesService: WavesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create wave',
    description: 'Create a new wave clip from a video asset',
  })
  @ApiBody({ type: CreateWaveDto })
  @ApiResponse({ status: 201, description: 'Wave created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateWaveDto) {
    const wave = await this.wavesService.create(dto);
    return { wave };
  }

  @Get()
  @ApiOperation({
    summary: 'List waves',
    description: 'Retrieve waves filtered by session or athlete',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description: 'Filter by session ID',
  })
  @ApiQuery({
    name: 'athleteId',
    required: false,
    description: 'Filter by athlete ID',
  })
  @ApiResponse({ status: 200, description: 'Waves retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('sessionId') sessionId?: string,
    @Query('athleteId') athleteId?: string,
  ) {
    const waves = await this.wavesService.findAll(sessionId, athleteId);
    return { waves };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get wave',
    description: 'Retrieve wave details by ID',
  })
  @ApiParam({ name: 'id', description: 'Wave ID' })
  @ApiResponse({ status: 200, description: 'Wave retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wave not found' })
  async findOne(@Param('id') id: string) {
    const wave = await this.wavesService.findOne(id);
    return { wave };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update wave',
    description: 'Update wave information',
  })
  @ApiParam({ name: 'id', description: 'Wave ID' })
  @ApiBody({ type: UpdateWaveDto })
  @ApiResponse({ status: 200, description: 'Wave updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wave not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateWaveDto) {
    const wave = await this.wavesService.update(id, dto);
    return { wave };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete wave',
    description: 'Permanently delete a wave',
  })
  @ApiParam({ name: 'id', description: 'Wave ID' })
  @ApiResponse({ status: 200, description: 'Wave deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wave not found' })
  async delete(@Param('id') id: string) {
    await this.wavesService.delete(id);
    return { message: 'Wave deleted successfully' };
  }

  @Post(':id/tags')
  @ApiOperation({
    summary: 'Tag athlete in wave',
    description: 'Tag an athlete in a specific wave',
  })
  @ApiParam({ name: 'id', description: 'Wave ID' })
  @ApiBody({ type: TagAthleteDto })
  @ApiResponse({ status: 201, description: 'Athlete tagged successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wave or athlete not found' })
  async tagAthlete(@Param('id') id: string, @Body() dto: TagAthleteDto) {
    const tag = await this.wavesService.tagAthlete(id, dto.athleteId);
    return { tag };
  }

  @Post(':id/scores')
  @ApiOperation({ summary: 'Score wave', description: 'Add a score to a wave' })
  @ApiParam({ name: 'id', description: 'Wave ID' })
  @ApiBody({ type: AddScoreDto })
  @ApiResponse({ status: 201, description: 'Score added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wave not found' })
  async addScore(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddScoreDto,
  ) {
    const score = await this.wavesService.addScore(
      id,
      user.id,
      dto.score,
      dto.category,
    );
    return { score };
  }

  @Post(':id/notes')
  @ApiOperation({
    summary: 'Add note to wave',
    description: 'Add a coaching note to a wave',
  })
  @ApiParam({ name: 'id', description: 'Wave ID' })
  @ApiBody({ type: AddNoteDto })
  @ApiResponse({ status: 201, description: 'Note added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wave not found' })
  async addNote(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddNoteDto,
  ) {
    const note = await this.wavesService.addNote(id, user.id, dto.content);
    return { note };
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Get wave download URL',
    description: 'Get a download URL for a wave video',
  })
  @ApiParam({ name: 'id', description: 'Wave ID' })
  @ApiResponse({
    status: 200,
    description: 'Download URL retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Wave not found' })
  async getDownloadUrl(@Param('id') id: string) {
    const url = await this.wavesService.getDownloadUrl(id);
    return { url };
  }
}
