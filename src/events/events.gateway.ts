import {
  UseGuards,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { TMP } from 'src/util';

@WebSocketGateway({
  
  cors: {
    origin: '*',
  },
  middlewares: [],
})
export class EventsGateway {

  constructor(
    private authService: AuthService,
  ){}

  @WebSocketServer()
  server: Server;

  wsClients = [];

  private broadcast(event, client, message: any) {
    for (let c of this.wsClients) {
      console.log(`send data to ${c.id}`);
      c.emit(event, message);
    }
  }

  private async getUserId(@MessageBody() data: string, @ConnectedSocket() client) {
    /********* 암시적인 에러 발생 가능 부분********/
    let haha = String(client.handshake.headers.authorization);
    haha = haha.replace("Bearer ", '');
    console.log(haha);
    /*********************************************/
    const user: TMP = await this.authService.jwtVerify(haha);
    return user.id;
  }


  @SubscribeMessage('join')
  async join(@MessageBody() data: string, @ConnectedSocket() client) {
    
    /********* 암시적인 에러 발생 가능 부분 ********/
    let userId = await this.getUserId(data, client);
    console.log(userId);
    /********************************************/

    this.wsClients.push(client);
    console.log(`${client.id} is data ${data} joined`);
  }

  @SubscribeMessage('send')
  async Send(@MessageBody() data: {} , @ConnectedSocket() client) {
    let haha = String(client.handshake.headers.authorization);
    console.log(haha);
    this.broadcast("message", client, data);
  }

  @SubscribeMessage('disconnected')
  async leaveClinet(@MessageBody() data: string, @ConnectedSocket() client){
    console.log("leave client id : " + client.id);
    for(var i = 0; i < this.wsClients.length; i++){ 
      if (this.wsClients[i].id == client.id) { 
        this.wsClients.splice(i, 1); 
        i--; 
      }
    }
  }
}