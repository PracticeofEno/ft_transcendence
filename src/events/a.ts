/*import { UsersService } from "src/users/users.service";
import { Injectable, CanActivate} from '@nestjs/common';
import { jwtConstants } from "src/auth/jwt/constants";

@Injectable()
export class WsGuard implements CanActivate {

  constructor(private userService: UsersService) {}
  canActivate(
    context: any,
  ): boolean | any | Promise<boolean | any> | Observable<boolean | any> {
    const bearerToken = context.args[0].handshake.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(bearerToken, jwtConstants.secret) as any;
      return new Promise((resolve, reject) => {
        return this.userService.getUserById(decoded.userId).then(user => {
          if (user) {
            resolve(user);
          } else {
            reject(false);
          }
        });

      });
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }
}
*/