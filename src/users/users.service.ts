import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../Entitys/user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  async getUserById(id2: string): Promise<User> {
    const found = await this.userRepository.findOneBy({id: id2});
    return found;
  }

  async createUser(id : string): Promise<User> {
    const user = await this.userRepository.createUser(id);
    return user;
  }

  async checkUser(id: string) : Promise<Boolean> {
    return this.userRepository.checkUser(id);
  }

  async getUserByNickname(nickname: string): Promise<User> {
    const found = await this.userRepository.getUserByNickname(nickname);
    return found;
  }

  async updateNickname(nickname: string, userid: string): Promise<void> {
    await this.userRepository.updateNickname(nickname, userid);
  }

  async setTwoFactorAuthenticationSecret(secret: string, userId: string) {
    return this.userRepository.update(userId, {
      twoFactorAuthenticationSecret: secret
    });
  }

  async turnOnTwoFactorAuthentication(userId: number) {
    return this.userRepository.update(userId, {
      isTwoFactorAuthenticationEnabled: true
    });
  }

  async turnOffTwoFactorAuthentication(userId: number) {
    return this.userRepository.update(userId, {
      isTwoFactorAuthenticationEnabled: false
    });
  }
}
