import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from './entities/asset.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RekognitionService } from './rekognition.service';
import { CdnService } from './cdn.service';
@Module({
  imports: [TypeOrmModule.forFeature([Asset])],
  controllers: [AssetsController],
  providers: [AssetsService, RekognitionService, CdnService],
  exports: [AssetsService],
})
export class AssetsModule {}
