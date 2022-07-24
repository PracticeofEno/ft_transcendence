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
exports.AuthService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const rxjs_1 = require("rxjs");
const users_service_1 = require("../users/users.service");
const constants_1 = require("./jwt/constants");
let AuthService = class AuthService {
    constructor(httpService, userService, jwtService) {
        this.httpService = httpService;
        this.userService = userService;
        this.jwtService = jwtService;
    }
    async getResourceOwnerId(code) {
        try {
            const resp = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://api.intra.42.fr/oauth/token', {
                grant_type: 'authorization_code',
                client_id: '3ec7b93e172975f3e87d20b018449c48708de52f07ff7cd66500b77152324e04',
                client_secret: '05968ea786cf978177601d35232af63e68e0641cbe4bec4fc6359520abf1d254',
                code: code,
                redirect_uri: 'http://localhost:5000/auth/',
            }, {
                headers: { 'Content-Type': 'application/json' },
            }));
            if (resp.status == 200) {
                const ret = await (0, rxjs_1.firstValueFrom)(this.httpService.get('https://api.intra.42.fr/oauth/token/info', {
                    headers: {
                        Authorization: 'Bearer ' + resp.data.access_token,
                    },
                }));
                if (ret.status == 200)
                    return ret.data.resource_owner_id;
                else
                    return '-1';
            }
            else {
                return '-1';
            }
        }
        catch (error) {
            return '-1';
        }
    }
    async getJwt(code) {
        const tmp = await this.getResourceOwnerId(code);
        if (tmp == '-1') {
            throw new common_1.HttpException("Can't get resourceOwner ID", common_1.HttpStatus.BAD_REQUEST);
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
    async jwtVerify(token) {
        const ret = await this.jwtService.verify(token, { secret: constants_1.jwtConstants.secret });
        return ret;
    }
};
__decorate([
    __param(0, (0, common_1.Body)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthService.prototype, "getJwt", null);
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map