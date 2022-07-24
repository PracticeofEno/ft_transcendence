import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
export declare class AuthService {
    private httpService;
    private userService;
    private jwtService;
    constructor(httpService: HttpService, userService: UsersService, jwtService: JwtService);
    getResourceOwnerId(code: string): Promise<string>;
    getJwt(code: string): Promise<string>;
    jwtVerify(token: string): Promise<Object>;
}
