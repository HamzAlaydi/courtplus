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
  NotFoundException,
} from '@nestjs/common';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';
import type { SessionUser } from 'src/modules/auth/@types/session';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiHeaders,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { UserTypeGuard } from 'src/modules/auth/guards/user-type.guard';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { Court } from './entities/court.entity';
import { ListCourtsDto } from './dto/list-courts.dto';
import { ListCourtsResponseDto } from './dto/list-courts-response.dto';
import { GetCourtAvailabilityDto } from './dto/get-court-availability.dto';
import { SlotsResponse } from './dto/slots-response.dto';
import { GetCourtAvailableDaysResponseDto } from './dto/get-court-days-availability-response.dto';
import { Location, UserLocation } from 'src/decorators/location.decorator';
import { COURT_NOT_FOUND } from '../shared/error-codes';
@ApiTags('Courts')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@ApiBearerAuth()
@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new court',
    description:
      'Creates a new court with the provided data. Only staff members can perform this operation.',
  })
  @ApiResponse({
    status: 201,
    description: 'The court has been successfully created.',
    type: Court,
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
  @AuthorizedUserType.isStaff()
  create(
    @Body() createCourtDto: CreateCourtDto,
    @CurrentUser() user: SessionUser,
  ): Promise<Court> {
    return this.courtsService.create(createCourtDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all courts',
    description:
      'Retrieves a paginated list of courts with optional filtering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of courts.',
    type: ListCourtsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Authentication is required.',
  })
  @ApiHeaders([
    {
      name: 'X-Location',
      description: 'The location of the user',
      example: '40.7128,-74.006',
      required: false,
    },
  ])
  find(
    @Query() query: ListCourtsDto,
    @Location() location: UserLocation,
    @CurrentUser() user: SessionUser,
  ): Promise<ListCourtsResponseDto> {
    return this.courtsService.findAll(
      {
        ...query,
        options: { include: { branch: true, bookmarks: true } },
      },
      user,
      location,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a court by id',
    description: 'Retrieves detailed information about a specific court.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the court details.',
    type: Court,
  })
  @ApiResponse({
    status: 404,
    description: 'Court not found with the specified ID.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Authentication is required.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the court to retrieve',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiHeaders([
    {
      name: 'X-Location',
      description: 'The location of the user',
      example: '40.7128,-74.006',
      required: false,
    },
  ])
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Location() location: UserLocation,
    @CurrentUser() user: SessionUser,
  ): Promise<Court> {
    const court = await this.courtsService.findOne(
      id,
      {
        branch: true,
        schedule: true,
        assets: true,
        location: true,
        availability: true,
      },
      user,
      location,
    );
    if (!court) {
      throw new NotFoundException(COURT_NOT_FOUND);
    }
    return court;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a court',
    description:
      'Updates an existing court with the provided data. Only staff members can perform this operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'The court has been successfully updated.',
    type: Court,
  })
  @ApiResponse({
    status: 404,
    description: 'Court not found with the specified ID.',
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
    description: 'The UUID of the court to update',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @AuthorizedUserType.isStaff()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourtDto: UpdateCourtDto,
    @CurrentUser() user: SessionUser,
  ): Promise<Court> {
    return this.courtsService.update(id, updateCourtDto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a court',
    description:
      'Soft-deletes a court. Only staff members can perform this operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'The court has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Court not found with the specified ID.',
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
    description: 'The UUID of the court to delete',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @AuthorizedUserType.isStaff()
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<void> {
    return this.courtsService.delete(id, user);
  }

  @Post(':id/resubmit')
  @ApiOperation({
    summary: 'Resubmit a court for approval',
    description:
      'Resubmits a court that has changes requested back to pending approval. Only staff members of the owning tenant can perform this operation.',
  })
  @ApiResponse({
    status: 200,
    description: 'The court has been successfully resubmitted.',
    type: Court,
  })
  @ApiResponse({
    status: 400,
    description: 'The court is not in changes_requested status.',
  })
  @ApiResponse({
    status: 404,
    description: 'Court not found with the specified ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the court to resubmit',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @AuthorizedUserType.isStaff()
  resubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<Court> {
    return this.courtsService.resubmit(id, user);
  }
  @Get(':id/availability')
  @ApiExtraModels(SlotsResponse, GetCourtAvailableDaysResponseDto)
  @ApiOperation({
    summary: 'Get court availability for a specific day',
    description:
      'Retrieves available and reserved time slots for a specific day.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns availability information based on the query parameters',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(SlotsResponse) },
        { $ref: getSchemaPath(GetCourtAvailableDaysResponseDto) },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Court not found with the specified ID.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Authentication is required.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the court',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  async getAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() { date, month }: GetCourtAvailabilityDto,
    @CurrentUser() user: SessionUser,
  ): Promise<SlotsResponse | GetCourtAvailableDaysResponseDto> {
    if (date) {
      const slots = await this.courtsService.getAvailability(
        id,
        { date, duration: 30 },
        user,
      );

      return { slots };
    } else {
      const court = await this.courtsService.findOne(id, { schedule: true }, user);
      if (!court) {
        throw new NotFoundException(COURT_NOT_FOUND);
      }
      const availability = await this.courtsService.getDaysAvailability(
        court.schedule,
        month,
        30,
      );

      return {
        availableDays: availability.availableDays,
        unavailableDays: availability.unavailableDays,
      };
    }
  }
}
