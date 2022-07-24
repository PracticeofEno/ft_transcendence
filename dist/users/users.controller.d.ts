/// <reference types="multer" />
import { StreamableFile } from '@nestjs/common';
import { User } from '../Entitys/user.entity';
import { UsersService } from './users.service';
import { TwoFactorAuthenticationService } from 'src/auth/2FA/twoFactorAuthentication.service';
import { AuthService } from 'src/auth/auth.service';
export declare class UsersController {
    private userService;
    private readonly twoFactorAuthenticationService;
    private authService;
    constructor(userService: UsersService, twoFactorAuthenticationService: TwoFactorAuthenticationService, authService: AuthService);
    login(res: any, code: string): Promise<any>;
    getUserById(req: any): Promise<User>;
    getAvatar(req: any, id: any): Promise<StreamableFile>;
    createUser(req: any, body: any): Promise<User>;
    createNickname(req: any, body: any): Promise<any>;
    uploadAvatar(req: any, file: Express.Multer.File): string;
    register(req: any): Promise<string>;
    turnOnTwoFactorAuthentication(req: any, body: any): Promise<void>;
    turnOffTwoFactorAuthentication(req: any, body: any): Promise<void>;
}
