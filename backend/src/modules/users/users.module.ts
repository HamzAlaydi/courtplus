import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { AssetsModule } from 'src/modules/assets/assets.module';
import { UserSport } from './entities/sport.entity';
import { AuthModule } from '../auth/auth.module';
import { Session } from '../auth/entities/session.entity';
import { Account } from '../auth/entities/account.entity';
import { UserPreferences } from './entities/user-preferences.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address, UserSport, Session, Account, UserPreferences]),
    AssetsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
