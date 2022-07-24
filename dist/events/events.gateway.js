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
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const auth_service_1 = require("../auth/auth.service");
let EventsGateway = class EventsGateway {
    constructor(authService) {
        this.authService = authService;
        this.wsClients = [];
    }
    broadcast(event, client, message) {
        for (let c of this.wsClients) {
            console.log(`send data to ${c.id}`);
            c.emit(event, message);
        }
    }
    async getUserId(data, client) {
        let haha = String(client.handshake.headers.authorization);
        haha = haha.replace("Bearer ", '');
        console.log(haha);
        const user = await this.authService.jwtVerify(haha);
        return user.id;
    }
    async join(data, client) {
        let userId = await this.getUserId(data, client);
        console.log(userId);
        this.wsClients.push(client);
        console.log(`${client.id} is data ${data} joined`);
    }
    async Send(data, client) {
        let haha = String(client.handshake.headers.authorization);
        console.log(haha);
        this.broadcast("message", client, data);
    }
    async leaveClinet(data, client) {
        console.log("leave client id : " + client.id);
        for (var i = 0; i < this.wsClients.length; i++) {
            if (this.wsClients[i].id == client.id) {
                this.wsClients.splice(i, 1);
                i--;
            }
        }
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "getUserId", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "join", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "Send", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('disconnected'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "leaveClinet", null);
EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        middlewares: [],
    }),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], EventsGateway);
exports.EventsGateway = EventsGateway;
//# sourceMappingURL=events.gateway.js.map