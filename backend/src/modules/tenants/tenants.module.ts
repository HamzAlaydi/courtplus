import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { TenantPreferences } from './entities/tenant-preferences.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from 'src/modules/assets/assets.module';
import { TenantsController } from './tenants.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { forwardRef } from '@nestjs/common';
@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantPreferences]), AssetsModule, forwardRef(() => SubscriptionsModule)],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule { }
