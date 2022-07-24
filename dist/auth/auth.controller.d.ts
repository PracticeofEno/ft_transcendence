import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { TwoFactorAuthenticationService } from './2FA/twoFactorAuthentication.service';
export declare class AuthController {
    private userService;
    private jwtService;
    private twoFactorService;
    constructor(userService: UsersService, jwtService: JwtService, twoFactorService: TwoFactorAuthenticationService);
    getTwoFactorJwt(req: any, res: any, code: string): Promise<any>;
}
