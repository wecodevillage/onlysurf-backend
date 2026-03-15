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
import { SessionsService } from './sessions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { SessionType, SessionStatus } from '@prisma/client';

class CreateSessionDto {
  academyId?: string;
  title: string;
  description?: string;
  type: SessionType;
  location?: string;
  photoUrl?: string;
  conditions?: string;
  notes?: string;
  photoPrice?: number;
  videoPrice?: number;
  currency?: string;
  latitude?: number;
  longitude?: number;
  scheduledAt?: Date;
}

class UpdateSessionDto {
  title?: string;
  description?: string;
  status?: SessionStatus;
  location?: string;
  photoUrl?: string;
  conditions?: string;
  notes?: string;
  photoPrice?: number;
  videoPrice?: number;
  currency?: string;
  latitude?: number;
  longitude?: number;
  scheduledAt?: Date;
}

class AddAthleteDto {
  athleteId: string;
}

@ApiTags('Sessions')
@ApiBearerAuth('firebase-auth')
@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create session',
    description: 'Create a new coaching or free surf session',
  })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSessionDto,
  ) {
    const session = await this.sessionsService.create(user.id, dto);
    return { session };
  }

  @Get()
  @ApiOperation({
    summary: 'List sessions',
    description: 'Retrieve all sessions with optional filters',
  })
  @ApiQuery({
    name: 'coachId',
    required: false,
    description: 'Filter by coach ID',
  })
  @ApiQuery({
    name: 'academyId',
    required: false,
    description: 'Filter by academy ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SessionStatus,
    description: 'Filter by session status',
  })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query('coachId') coachId?: string,
    @Query('academyId') academyId?: string,
    @Query('status') status?: SessionStatus,
  ) {
    const sessions = await this.sessionsService.findAll(
      coachId,
      academyId,
      status,
    );
    return { sessions };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get session',
    description: 'Retrieve session details by ID',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findOne(@Param('id') id: string) {
    const session = await this.sessionsService.findOne(id);
    return { session };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update session',
    description: 'Update session information',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiBody({ type: UpdateSessionDto })
  @ApiResponse({ status: 200, description: 'Session updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    const session = await this.sessionsService.update(id, dto);
    return { session };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete session',
    description: 'Permanently delete a session',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async delete(@Param('id') id: string) {
    await this.sessionsService.delete(id);
    return { message: 'Session deleted successfully' };
  }

  @Post(':id/roster')
  @ApiOperation({
    summary: 'Add athlete to session',
    description: 'Assign an athlete to a session roster',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiBody({ type: AddAthleteDto })
  @ApiResponse({
    status: 201,
    description: 'Athlete added to session successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session or athlete not found' })
  async addAthlete(@Param('id') id: string, @Body() dto: AddAthleteDto) {
    const roster = await this.sessionsService.addAthlete(id, dto.athleteId);
    return { roster };
  }

  @Get(':id/summary')
  @ApiOperation({
    summary: 'Get session summary',
    description: 'Retrieve statistical summary for a session',
  })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSummary(@Param('id') id: string) {
    const summary = await this.sessionsService.getSummary(id);
    return summary;
  }
}
