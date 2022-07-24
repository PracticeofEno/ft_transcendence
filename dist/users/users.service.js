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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_repository_1 = require("./user.repository");
let UsersService = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async getUserById(id2) {
        const found = await this.userRepository.findOneBy({ id: id2 });
        return found;
    }
    async createUser(id) {
        const user = await this.userRepository.createUser(id);
        return user;
    }
    async checkUser(id) {
        return this.userRepository.checkUser(id);
    }
    async getUserByNickname(nickname) {
        const found = await this.userRepository.getUserByNickname(nickname);
        return found;
    }
    async updateNickname(nickname, userid) {
        await this.userRepository.updateNickname(nickname, userid);
    }
    async setTwoFactorAuthenticationSecret(secret, userId) {
        return this.userRepository.update(userId, {
            twoFactorAuthenticationSecret: secret
        });
    }
    async turnOnTwoFactorAuthentication(userId) {
        return this.userRepository.update(userId, {
            isTwoFactorAuthenticationEnabled: true
        });
    }
    async turnOffTwoFactorAuthentication(userId) {
        return this.userRepository.update(userId, {
            isTwoFactorAuthenticationEnabled: false
        });
    }
};
UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_repository_1.UserRepository)),
    __metadata("design:paramtypes", [user_repository_1.UserRepository])
], UsersService);
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map