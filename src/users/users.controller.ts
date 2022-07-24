import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Request,
  Response,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';
import { User } from '../Entitys/user.entity';
import { UsersService } from './users.service';
import { TMP, imageFileFilter} from 'src/util';
import { TwoFactorAuthenticationService } from 'src/auth/2FA/twoFactorAuthentication.service';
import JwtTwoFactorGuard from 'src/auth/jwt/jwt-two-factor.guard';
import { AuthService } from 'src/auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(
    private userService: UsersService,
    private readonly twoFactorAuthenticationService: TwoFactorAuthenticationService,
    private authService: AuthService,
    ) {}

  @Post('/login')
  async login(@Response() res, @Body('code') code: string) {
    const jwt = await this.authService.getJwt(code);
    console.log(jwt);
    res.setHeader('Authorization', 'Bearer ' + jwt);
    res.cookie('jwt', jwt, {
      maxAge: 60 * 60 * 1000
    });
    return res.send({
      message: 'success'
    });
  }
  
  @UseGuards(JwtTwoFactorGuard)
  @Get('/')
  async getUserById(@Request() req): Promise<User> {
    return this.userService.getUserById(req.user.id);
  }

  @Get('/avatar/:id')
  async getAvatar(@Request() req, @Param('id') id){
      const file = createReadStream(join(process.cwd(), "src/users/avatar/" + id + ".png"));
      file.on("error", err => {
        console.log("file exist error");
        return ;
      })
      return new StreamableFile(file);
    
  }

  @UseGuards(JwtTwoFactorGuard)
  @Post('/')
  async createUser(@Request() req, @Body() body) {
    const user = this.userService.createUser(req.user.id);
    return user;
  }

  @UseGuards(JwtTwoFactorGuard)
  @Post('/nickname')
  async createNickname(@Request() req, @Body() body) {
    let user;
    try {
      user = await this.userService.getUserByNickname(body.nickname);
      console.log(user)
      if (user)
        throw new HttpException("Exist nickname", 409);
    } catch (error) {
      user = await this.userService.updateNickname(body.nickname, req.user.id);  
    }
    return user;
  }

  @UseGuards(JwtTwoFactorGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './src/users/avatar',
        filename: (req, file, cb) => {
          let p1: TMP = {};
          p1 = req.user;
          cb(null, `${p1.id}.png`);
        },
      }),
      fileFilter: imageFileFilter
    }), 
  )
  @Post('/avatar')
  uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return file.destination.substring(file.destination.indexOf("users")) + "/" + req.user.id;
  }

  @Get('generate')
  @UseGuards(JwtTwoFactorGuard)
  async register(@Request() req){
    const { otpauthUrl } = await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(req.user);
    return otpauthUrl;
   // return this.twoFactorAuthenticationService.pipeQrCodeStream(res, otpauthUrl);
  }

  @Post('turn-on')
  @UseGuards(JwtTwoFactorGuard)
  async turnOnTwoFactorAuthentication(@Request() req, @Body() body){
    let user = await this.userService.getUserById(req.user.id);
    const isCodeValid = this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(
        body.code, user
    );
    console.log(`twofactor code  :  ${isCodeValid}`);
    if (!isCodeValid) {
      console.log("fail");
      throw new UnauthorizedException('Wrong authentication code');
    }
    await this.userService.turnOnTwoFactorAuthentication(req.user.id);
  }

  @Post('turn-off')
  @UseGuards(JwtTwoFactorGuard)
  async turnOffTwoFactorAuthentication(@Request() req, @Body() body){
    await this.userService.turnOffTwoFactorAuthentication(req.user.id);
    console.log(`turn off`);
  }
}
