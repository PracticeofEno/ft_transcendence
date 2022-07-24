import { User } from 'src/Entitys/user.entity';
import { UsersService } from '../../users/users.service';
export declare class TwoFactorAuthenticationService {
    private readonly usersService;
    constructor(usersService: UsersService);
    generateTwoFactorAuthenticationSecret(user: User): Promise<{
        secret: string;
        otpauthUrl: string;
    }>;
    pipeQrCodeStream(stream: Response, otpauthUrl: string): Promise<any>;
    isTwoFactorAuthenticationCodeValid(code: string, user: User): any;
}
export declare class TwoFactorAuthenticationDto {
    code: string;
}
