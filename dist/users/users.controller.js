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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const fs_1 = require("fs");
const multer_1 = require("multer");
const path_1 = require("path");
const users_service_1 = require("./users.service");
const util_1 = require("../util");
const twoFactorAuthentication_service_1 = require("../auth/2FA/twoFactorAuthentication.service");
const jwt_two_factor_guard_1 = require("../auth/jwt/jwt-two-factor.guard");
const auth_service_1 = require("../auth/auth.service");
let UsersController = class UsersController {
    constructor(userService, twoFactorAuthenticationService, authService) {
        this.userService = userService;
        this.twoFactorAuthenticationService = twoFactorAuthenticationService;
        this.authService = authService;
    }
    async login(res, code) {
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
    async getUserById(req) {
        return this.userService.getUserById(req.user.id);
    }
    async getAvatar(req, id) {
        const file = (0, fs_1.createReadStream)((0, path_1.join)(process.cwd(), "src/users/avatar/" + id + ".png"));
        file.on("error", err => {
            console.log("file exist error");
            return;
        });
        return new common_1.StreamableFile(file);
    }
    async createUser(req, body) {
        const user = this.userService.createUser(req.user.id);
        return user;
    }
    async createNickname(req, body) {
        let user;
        try {
            user = await this.userService.getUserByNickname(body.nickname);
            console.log(user);
            if (user)
                throw new common_1.HttpException("Exist nickname", 409);
        }
        catch (error) {
            user = await this.userService.updateNickname(body.nickname, req.user.id);
        }
        return user;
    }
    uploadAvatar(req, file) {
        return file.destination.substring(file.destination.indexOf("users")) + "/" + req.user.id;
    }
    async register(req) {
        const { otpauthUrl } = await this.twoFactorAuthenticationService.generateTwoFactorAuthenticationSecret(req.user);
        return otpauthUrl;
    }
    async turnOnTwoFactorAuthentication(req, body) {
        let user = await this.userService.getUserById(req.user.id);
        const isCodeValid = this.twoFactorAuthenticationService.isTwoFactorAuthenticationCodeValid(body.code, user);
        console.log(`twofactor code  :  ${isCodeValid}`);
        if (!isCodeValid) {
            console.log("fail");
            throw new common_1.UnauthorizedException('Wrong authentication code');
        }
        await this.userService.turnOnTwoFactorAuthentication(req.user.id);
    }
    async turnOffTwoFactorAuthentication(req, body) {
        await this.userService.turnOffTwoFactorAuthentication(req.user.id);
        console.log(`turn off`);
    }
};
__decorate([
    (0, common_1.Post)('/login'),
    __param(0, (0, common_1.Response)()),
    __param(1, (0, common_1.Body)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_two_factor_guard_1.default),
    (0, common_1.Get)('/'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Get)('/avatar/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAvatar", null);
__decorate([
    (0, common_1.UseGuards)(jwt_two_factor_guard_1.default),
    (0, common_1.Post)('/'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_two_factor_guard_1.default),
    (0, common_1.Post)('/nickname'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createNickname", null);
__decorate([
    (0, common_1.UseGuards)(jwt_two_factor_guard_1.default),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './src/users/avatar',
            filename: (req, file, cb) => {
                let p1 = {};
                p1 = req.user;
                cb(null, `${p1.id}.png`);
            },
        }),
        fileFilter: util_1.imageFileFilter
    })),
    (0, common_1.Post)('/avatar'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Get)('generate'),
    (0, common_1.UseGuards)(jwt_two_factor_guard_1.default),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('turn-on'),
    (0, common_1.UseGuards)(jwt_two_factor_guard_1.default),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "turnOnTwoFactorAuthentication", null);
__decorate([
    (0, common_1.Post)('turn-off'),
    (0, common_1.UseGuards)(jwt_two_factor_guard_1.default),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "turnOffTwoFactorAuthentication", null);
UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        twoFactorAuthentication_service_1.TwoFactorAuthenticationService,
        auth_service_1.AuthService])
], UsersController);
exports.UsersController = UsersController;
//# sourceMappingURL=users.controller.js.map