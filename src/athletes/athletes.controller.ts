import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AthletesService } from './athletes.service';

@ApiTags('Athletes')
@ApiBearerAuth('firebase-auth')
@Controller('athletes')
export class AthletesController {
  constructor(private athletesService: AthletesService) {}

  @Get()
  @ApiOperation({
    summary: 'List athletes',
    description: 'Retrieve all athletes, optionally filtered by academy',
  })
  @ApiQuery({
    name: 'academyId',
    required: false,
    description: 'Filter athletes by academy ID',
  })
  @ApiResponse({ status: 200, description: 'Athletes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query('academyId') academyId?: string) {
    const athletes = await this.athletesService.findAll(academyId);
    return { athletes };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get athlete',
    description: 'Retrieve athlete details by ID',
  })
  @ApiParam({ name: 'id', description: 'Athlete ID' })
  @ApiResponse({ status: 200, description: 'Athlete retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  async findOne(@Param('id') id: string) {
    const athlete = await this.athletesService.findOne(id);
    return { athlete };
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get athlete statistics',
    description: 'Retrieve performance statistics for an athlete',
  })
  @ApiParam({ name: 'id', description: 'Athlete ID' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  async getStats(@Param('id') id: string) {
    const stats = await this.athletesService.getStats(id);
    return { stats };
  }
}
