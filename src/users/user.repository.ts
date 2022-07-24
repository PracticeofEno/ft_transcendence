import { NotFoundException, HttpException } from '@nestjs/common';
import { CustomRepository } from 'src/database/typeorm-ex.decorator';
import { Repository } from 'typeorm';
import { User } from '../Entitys/user.entity';

@CustomRepository(User)
export class UserRepository extends Repository<User> {

  async checkUser(id2: string) : Promise<Boolean> {
    const found = await this.findOneBy( {id: id2});
    if (found) {
      return true;
    }
    return false;
  }

  async getUserById(id2: string): Promise<User> {
    const found = await this.findOneBy( {id: id2});
    if (!found) {
      throw new NotFoundException(`this is getuserById repository`);
    }
    return found;
  }

  async getUserByNickname(nickname2: string): Promise<User | undefined> {
    const found = await this.findOneBy( { nickname: nickname2 });
    if (!found) {
      throw new NotFoundException();
    }
    return found;
  }

  async createUser(userid: string) : Promise<User> {
    let user;
    const found = await this.findOneBy( {id: userid});
    if (!found) {
      user = new User();
      user.id = userid;
      user.nickname = "";
      user.win = 0;
      user.lose = 0;
      user.admin = false;
      user.avatarPath = "users/avatar/" + userid;
      user.lating = 1000;
      user.twoFactorAuthenticationSecret = "";
      user.isTwoFactorAuthenticationEnabled = false;
      console.log("create user");
      await this.save(user);
    }
    else
    {
      throw new HttpException('Exist id', 409);
    }
    return user;
  }

  async updateNickname(nick: string, userid: string): Promise<void>{
    let user;
    user = await this.getUserById(userid);
    user.nickname = nick;
    this.update(userid, user);
    console.log("save complete");
  }
}
