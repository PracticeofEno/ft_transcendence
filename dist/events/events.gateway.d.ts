import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
export declare class EventsGateway {
    private authService;
    constructor(authService: AuthService);
    server: Server;
    wsClients: any[];
    private broadcast;
    private getUserId;
    join(data: string, client: any): Promise<void>;
    Send(data: {}, client: any): Promise<void>;
    leaveClinet(data: string, client: any): Promise<void>;
}
