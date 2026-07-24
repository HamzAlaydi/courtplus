import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserAuthController } from './auth.users.controller';
import { StaffAuthController } from './auth.staff.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Verification } from './entities/verification.entity';
import { Session } from './entities/session.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh.strategy';
import { Account } from './entities/account.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { StaffModule } from 'src/modules/staff/staff.module';
import { VerificationService } from './verification.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    StaffModule,
    TypeOrmModule.forFeature([Account, Verification, Session]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],
  controllers: [UserAuthController, StaffAuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshTokenStrategy,
    VerificationService,
  ],
  exports: [AuthService, VerificationService],
})
export class AuthModule {}
