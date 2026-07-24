import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Branch } from './entities/branch.entity';
import { ListBranchesDto } from './dto/list-branches.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { UserTypeGuard } from 'src/modules/auth/guards/user-type.guard';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { UserType } from 'src/modules/auth/@types/user.type';
import { ListBranchesResponseDto } from './dto/list-branches-response.dto';
import { GetBranchDto } from './dto/get-branch.dto';
import { Audited } from 'src/decorators/audited.decorator';
import { LogAction, LogEntity } from '../logging/entities/log.entity';

@ApiTags('Branches')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new branch',
    description:
      'Creates a new branch with the provided data. Only staff members can perform this operation.',
  })
  @ApiResponse({
    status: 201,
    description: 'The branch has been successfully created.',
    type: Branch,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid input data. Check the request body for validation errors.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Authentication is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have staff privileges.',
  })
  @ApiBody({
    type: CreateBranchDto,
    description: 'The branch data to create',
    examples: {
      withPlaceId: {
        value: {
          name: 'Downtown Branch',
          phoneNumber: '+1234567890',
          placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          status: 'open',
          isVisible: true,
          coverAssetId: '123e4567-e89b-12d3-a456-426614174000',
          logoAssetId: '123e4567-e89b-12d3-a456-426614174000',
          schedule: {
            timeZone: 'America/New_York',
            availabilities: [
              {
                days: [1, 2, 3, 4, 5],
                startTime: '09:00',
                endTime: '17:00',
              },
            ],
          },
        },
        summary: 'Branch creation with Google Place ID',
      },
      withCoordinates: {
        value: {
          name: 'Downtown Branch',
          phoneNumber: '+1234567890',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060,
          },
          address: '123 Main St, New York, NY 10001',
          status: 'open',
          isVisible: true,
          coverAssetId: '123e4567-e89b-12d3-a456-426614174000',
          logoAssetId: '123e4567-e89b-12d3-a456-426614174000',
          schedule: {
            timeZone: 'America/New_York',
            availabilities: [
              {
                days: [1, 2, 3, 4, 5],
                startTime: '09:00',
                endTime: '17:00',
              },
            ],
          },
        },
        summary: 'Branch creation with coordinates',
      },
    },
  })
  @Audited(LogEntity.BRANCH, LogAction.CREATE)
  @AuthorizedUserType.isStaff()
  create(
    @Body() createBranchDto: CreateBranchDto,
    @CurrentUser() user: SessionUser,
  ): Promise<Branch> {
    return this.branchesService.create(createBranchDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all branches',
    description:
      'Retrieves a paginated list of branches with optional filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of branches.',
    type: ListBranchesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Authentication is required.',
  })
  find(
    @Query() query: ListBranchesDto,
    @CurrentUser() user: SessionUser,
  ): Promise<ListBranchesResponseDto> {
    return this.branchesService.find(
      {
        ...query,
        options: {
          include: {
            bookmarks: user.type === UserType.Customer,
            stats: user.type === UserType.Staff,
          },
        },
      },
      user,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a branch by id',
    description: 'Retrieves detailed information about a specific branch.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the branch details.',
    type: Branch,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found with the specified ID.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Authentication is required.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the branch to retrieve',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
    @Query() query: GetBranchDto,
  ): Promise<Branch> {
    return this.branchesService.findOne(id, user, query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a branch',
    description:
      'Updates an existing branch with the provided data. Only staff members can perform this operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'The branch has been successfully updated.',
    type: Branch,
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found with the specified ID.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid input data. Check the request body for validation errors.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Authentication is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have staff privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the branch to update',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    type: UpdateBranchDto,
    description: 'The branch data to update (partial)',
    examples: {
      withPlaceId: {
        value: {
          name: 'Downtown Branch',
          phoneNumber: '+1234567890',
          placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          status: 'open',
          isVisible: true,
          coverAssetId: '123e4567-e89b-12d3-a456-426614174000',
          logoAssetId: '123e4567-e89b-12d3-a456-426614174000',
          schedule: {
            timeZone: 'America/New_York',
            availabilities: [
              {
                days: [1, 2, 3, 4, 5],
                startTime: '09:00',
                endTime: '17:00',
              },
            ],
          },
        },
        summary: 'Branch update with Google Place ID',
      },
      withCoordinates: {
        value: {
          name: 'Downtown Branch',
          phoneNumber: '+1234567890',
          coordinates: {
            lat: 40.7128,
            lng: -74.0060,
          },
          address: '123 Main St, New York, NY 10001',
          status: 'open',
          isVisible: true,
          coverAssetId: '123e4567-e89b-12d3-a456-426614174000',
          logoAssetId: '123e4567-e89b-12d3-a456-426614174000',
          schedule: {
            timeZone: 'America/New_York',
            availabilities: [
              {
                days: [1, 2, 3, 4, 5],
                startTime: '09:00',
                endTime: '17:00',
              },
            ],
          },
        },
        summary: 'Branch update with coordinates',
      },
    },
  })
  @Audited(LogEntity.BRANCH, LogAction.UPDATE)
  @AuthorizedUserType.isStaff()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @CurrentUser() user: SessionUser,
  ): Promise<Branch> {
    return this.branchesService.update(id, updateBranchDto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a branch',
    description:
      'Soft-deletes a branch. Only staff members can perform this operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'The branch has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Branch not found with the specified ID.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Authentication is required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have staff privileges.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the branch to delete',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Audited(LogEntity.BRANCH, LogAction.DELETE)
  @AuthorizedUserType.isStaff()
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<void> {
    return this.branchesService.delete(id, user);
  }
}
