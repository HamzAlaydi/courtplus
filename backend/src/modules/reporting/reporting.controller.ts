import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsDto } from './dto/list-reports.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { SessionUser } from '../auth/@types/session';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { ListReportsResultDto } from './dto/list-reports-response.dto';
import { Report } from './entities/report.entity';
@ApiTags('Reporting')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@Controller('report')
@ApiBearerAuth()
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({
    status: 201,
    description: 'The report has been successfully created.',
  })
  @AuthorizedUserType.isCustomer()
  create(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser() user: SessionUser,
  ): Promise<Report> {
    return this.reportingService.createReport(createReportDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({ status: 200, description: 'Returns all reports.' })
  @ApiQuery({ type: ListReportsDto })
  @AuthorizedUserType.isStaff()
  find(@Query() query: ListReportsDto): Promise<ListReportsResultDto> {
    return this.reportingService.listReports(query);
  }
}
