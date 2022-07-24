"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_ex_decorator_1 = require("../database/typeorm-ex.decorator");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../Entitys/user.entity");
let UserRepository = class UserRepository extends typeorm_1.Repository {
    async checkUser(id2) {
        const found = await this.findOneBy({ id: id2 });
        if (found) {
            return true;
        }
        return false;
    }
    async getUserById(id2) {
        const found = await this.findOneBy({ id: id2 });
        if (!found) {
            throw new common_1.NotFoundException(`this is getuserById repository`);
        }
        return found;
    }
    async getUserByNickname(nickname2) {
        const found = await this.findOneBy({ nickname: nickname2 });
        if (!found) {
            throw new common_1.NotFoundException();
        }
        return found;
    }
    async createUser(userid) {
        let user;
        const found = await this.findOneBy({ id: userid });
        if (!found) {
            user = new user_entity_1.User();
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
        else {
            throw new common_1.HttpException('Exist id', 409);
        }
        return user;
    }
    async updateNickname(nick, userid) {
        let user;
        user = await this.getUserById(userid);
        user.nickname = nick;
        this.update(userid, user);
        console.log("save complete");
    }
};
UserRepository = __decorate([
    (0, typeorm_ex_decorator_1.CustomRepository)(user_entity_1.User)
], UserRepository);
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map