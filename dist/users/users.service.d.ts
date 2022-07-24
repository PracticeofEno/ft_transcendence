import { User } from '../Entitys/user.entity';
import { UserRepository } from './user.repository';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: UserRepository);
    getUserById(id2: string): Promise<User>;
    createUser(id: string): Promise<User>;
    checkUser(id: string): Promise<Boolean>;
    getUserByNickname(nickname: string): Promise<User>;
    updateNickname(nickname: string, userid: string): Promise<void>;
    setTwoFactorAuthenticationSecret(secret: string, userId: string): Promise<import("typeorm").UpdateResult>;
    turnOnTwoFactorAuthentication(userId: number): Promise<import("typeorm").UpdateResult>;
    turnOffTwoFactorAuthentication(userId: number): Promise<import("typeorm").UpdateResult>;
}
