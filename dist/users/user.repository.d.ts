import { Repository } from 'typeorm';
import { User } from '../Entitys/user.entity';
export declare class UserRepository extends Repository<User> {
    checkUser(id2: string): Promise<Boolean>;
    getUserById(id2: string): Promise<User>;
    getUserByNickname(nickname2: string): Promise<User | undefined>;
    createUser(userid: string): Promise<User>;
    updateNickname(nick: string, userid: string): Promise<void>;
}
