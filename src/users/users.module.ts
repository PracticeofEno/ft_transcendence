import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwoFactorAuthenticationService } from 'src/auth/2FA/twoFactorAuthentication.service';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { JwtTwoFactorStrategy } from 'src/auth/jwt/jwt-two-factor.strategy';
import { TypeOrmExModule } from 'src/database/typeorm-ex-module';
import { User } from '../Entitys/user.entity';
import { UserRepository } from './user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmExModule.forCustomRepository([UserRepository]),
    MulterModule.register({ 
      dest: './src/users/avatar',
    }),
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    TwoFactorAuthenticationService,
    JwtTwoFactorStrategy,
  ],
})
export class UsersModule {}
