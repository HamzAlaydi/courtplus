import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GenerateUrlDto } from './dto/generate-url.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import type { SessionUser } from '../auth/@types/session';
import { S3SignedUrlResponse } from './dto/s3-signed-url-response';

@Controller('assets')
@ApiTags('Assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('signed-url')
  generateUrl(
    @Body() body: GenerateUrlDto,
    @CurrentUser() user: SessionUser,
  ): Promise<S3SignedUrlResponse> {
    return this.assetsService.generateUploadUrl(body, user);
  }
}
