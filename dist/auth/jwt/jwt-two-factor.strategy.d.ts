import { Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
declare const JwtTwoFactorStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtTwoFactorStrategy extends JwtTwoFactorStrategy_base {
    private userService;
    constructor(userService: UsersService);
    validate(payload: any): Promise<import("../../Entitys/user.entity").User>;
}
export {};
