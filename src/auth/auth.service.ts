import { HttpService } from '@nestjs/axios';
import { Injectable, Response, Body, HttpStatus, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { UsersService } from 'src/users/users.service';
import { jwtConstants } from './jwt/constants';

@Injectable()
export class AuthService {
  constructor(
    private httpService: HttpService,
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  //해당 access_code로부터 리소스아이디를 가져옴, 에러나면 -1
  async getResourceOwnerId(code: string): Promise<string> {
    try {
      const resp = await firstValueFrom(
        this.httpService.post(
          'https://api.intra.42.fr/oauth/token',
          {
            grant_type: 'authorization_code',
            client_id:
              '3ec7b93e172975f3e87d20b018449c48708de52f07ff7cd66500b77152324e04',
            client_secret:
              '05968ea786cf978177601d35232af63e68e0641cbe4bec4fc6359520abf1d254',
            code: code,
            redirect_uri: 'http://localhost:5000/auth/',
          },
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      if (resp.status == 200) {
        const ret = await firstValueFrom(
          this.httpService.get('https://api.intra.42.fr/oauth/token/info', {
            headers: {
              Authorization: 'Bearer ' + resp.data.access_token,
            },
          }),
        );
        if (ret.status == 200) 
          return ret.data.resource_owner_id;
        else 
          return '-1';
      } 
      else {
        return '-1';
      }
    } catch (error) {
      return '-1';
    }
  }

  async getJwt(@Body('code') code: string) {
    const tmp = await this.getResourceOwnerId(code);
    if (tmp == '-1') {
      throw new HttpException(
        "Can't get resourceOwner ID",
        HttpStatus.BAD_REQUEST,
      );
    }
    else {
      if (await this.userService.checkUser(tmp) == false) {
        await this.userService.createUser(tmp);
      }
      const user = await this.userService.getUserById(tmp);
      const payload = { id: tmp, sub: tmp };
      const jwt = await this.jwtService.sign(payload);
      return jwt;
    }
  }

  async jwtVerify(token: string) : Promise<Object> {
    const ret = await this.jwtService.verify(token, { secret: jwtConstants.secret });
    return ret;
  }

}
