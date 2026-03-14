import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AcademiesService } from './academies.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole, MemberRole } from '@prisma/client';

class CreateAcademyDto {
  name: string;
  description?: string;
  logoUrl?: string;
  location?: string;
  website?: string;
}

class UpdateAcademyDto {
  name?: string;
  description?: string;
  logoUrl?: string;
  location?: string;
  website?: string;
}

class AddMemberDto {
  userId: string;
  role?: MemberRole;
}

@ApiTags('Academies')
@ApiBearerAuth('firebase-auth')
@Controller('academies')
@UseGuards(RolesGuard)
export class AcademiesController {
  constructor(private academiesService: AcademiesService) {}

  @Post()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create academy',
    description: 'Create a new surf academy',
  })
  @ApiBody({ type: CreateAcademyDto })
  @ApiResponse({ status: 201, description: 'Academy created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - requires COACH or ADMIN role',
  })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAcademyDto,
  ) {
    const academy = await this.academiesService.create(user.id, dto);
    return { academy };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get academy',
    description: 'Retrieve academy by ID',
  })
  @ApiParam({ name: 'id', description: 'Academy ID' })
  @ApiResponse({ status: 200, description: 'Academy retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Academy not found' })
  async findOne(@Param('id') id: string) {
    const academy = await this.academiesService.findOne(id);
    return { academy };
  }

  @Patch(':id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update academy',
    description: 'Update academy information',
  })
  @ApiParam({ name: 'id', description: 'Academy ID' })
  @ApiBody({ type: UpdateAcademyDto })
  @ApiResponse({ status: 200, description: 'Academy updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not an academy admin' })
  @ApiResponse({ status: 404, description: 'Academy not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateAcademyDto,
  ) {
    const academy = await this.academiesService.update(id, user.id, dto);
    return { academy };
  }

  @Get(':id/members')
  @ApiOperation({
    summary: 'Get academy members',
    description: 'List all members of an academy',
  })
  @ApiParam({ name: 'id', description: 'Academy ID' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Academy not found' })
  async getMembers(@Param('id') id: string) {
    const members = await this.academiesService.getMembers(id);
    return { members };
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get academy statistics',
    description:
      'Retrieve academy summary statistics including sessions, members, waves, and media totals',
  })
  @ApiParam({ name: 'id', description: 'Academy ID' })
  @ApiResponse({
    status: 200,
    description: 'Academy stats retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Academy not found' })
  async getStats(@Param('id') id: string) {
    const stats = await this.academiesService.getStats(id);
    return { stats };
  }

  @Post(':id/invites')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Add member to academy',
    description: 'Invite or add a member to the academy',
  })
  @ApiParam({ name: 'id', description: 'Academy ID' })
  @ApiBody({ type: AddMemberDto })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not an academy admin' })
  @ApiResponse({ status: 404, description: 'Academy or user not found' })
  async addMember(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddMemberDto,
  ) {
    const membership = await this.academiesService.addMember(
      id,
      user.id,
      dto.userId,
      dto.role,
    );
    return { membership };
  }
}
