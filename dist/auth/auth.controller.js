"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const twoFactorAuthentication_service_1 = require("./2FA/twoFactorAuthentication.service");
const jwt_auth_gaurd_1 = require("./jwt/jwt-auth.gaurd");
let AuthController = class AuthController {
    constructor(userService, jwtService, twoFactorService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.twoFactorService = twoFactorService;
    }
    async getTwoFactorJwt(req, res, code) {
        let user = await this.userService.getUserById(req.user.id);
        const isCodeValid = this.twoFactorService.isTwoFactorAuthenticationCodeValid(code, user);
        console.log(`twofactor code  :  ${isCodeValid}`);
        if (!isCodeValid) {
            console.log("fail");
            throw new common_1.UnauthorizedException('Wrong authentication code');
        }
        else {
            const payload = { id: user.id, isSecondFactorAuthenticated: true, sub: user.id };
            const jwt = await this.jwtService.sign(payload);
            res.setHeader('Authorization', 'Bearer ' + jwt);
            res.cookie('jwt', jwt, {
                maxAge: 60 * 60 * 1000
            });
            return res.send({
                message: 'success'
            });
        }
    }
};
__decorate([
    (0, common_1.Post)('/two'),
    (0, common_1.UseGuards)(jwt_auth_gaurd_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Response)()),
    __param(2, (0, common_1.Body)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getTwoFactorJwt", null);
AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        twoFactorAuthentication_service_1.TwoFactorAuthenticationService])
], AuthController);
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map