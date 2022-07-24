import { BaseEntity } from 'typeorm';
export declare class User extends BaseEntity {
    id: string;
    nickname: string;
    win: number;
    lose: number;
    admin: boolean;
    avatarPath: string;
}
