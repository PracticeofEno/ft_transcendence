import { Module } from '@nestjs/common';
import { TwoFactorAuthenticationService } from 'src/auth/2FA/twoFactorAuthentication.service';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { JwtTwoFactorStrategy } from 'src/auth/jwt/jwt-two-factor.strategy';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [
    AuthModule,
  ],
  providers: [
    EventsGateway,
  ],
})
export class EventsModule {}
