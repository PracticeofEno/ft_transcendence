import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthService } from "../auth/auth.service";
import { TMP, UserStatusType } from "../util";
import { User } from "../Entitys/user.entity";
import { UsersService } from "../users/users.service";
import { addAbortSignal } from "stream";
import { GameData } from "./game.data";
import { MatchHistorysService } from "../match_history/history.service";
import { HistoryDto } from "../match_history/history.dto";
import { ChattingGateway } from "../chatting/chatting.gateway";
import { LoginUserGateway } from "../chatting/current.login.gateway";
import { ChannelsService } from "../channel/channels.service";
import { CreateChannelDto } from "../channel/channel.dto";
import * as bcrypt from "bcrypt";

let rankRoom: number = 0;
let normalRoom: number = 1;
const finishScore = 5;

interface RoomData {
  name: string;
  pass: string;
  mode: number;
  person: number;
  id: number;
  secret: boolean;
  participation: boolean;
}

/**id, notice 필요 여부 확인해야됨. */
interface Chat {
  channel_id: number;
  message: string;
  sender: {
    id: string;
    nickname: string;
    avatarPath: string;
  };
}

let roomManager = new Map<number, GameData>();

let roomList = new Map<number, RoomData>();

let getPlayerWithRoomnum = new Map<number, [string, string]>();

let getRoomNumWithID = new Map<string, number>();

let getUser = new Map<number, [User, User]>();
let getUserList = new Map<number, User[]>();

let checkReady = new Map<number, [boolean, boolean]>();
let checkStart = new Map<number, [boolean, boolean]>();

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  middlewares: [],
  namespace: "/game",
})
export class GameGateway {
  constructor(private authService: AuthService, private userService: UsersService, private channelService: ChannelsService, private matchHistorysService: MatchHistorysService, private chatGateway: ChattingGateway, private loginUserGateway: LoginUserGateway) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(@ConnectedSocket() client) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);
    console.log("connect game : " + user.nickname);
    // await this.statusHandler(user, UserStatusType.ONLINE); // 게임방 들어갈때 change_data 두번 들어오는 이슈로 주석처리
  }

  async statusHandler(user: User, type: UserStatusType) {
    this.userService.updateStatus(user, type);
    this.loginUserGateway.broadCastingEvent("change_status", {
      id: user.id,
      nickname: user.nickname,
      avatarPath: user.avatarPath,
      status: type,
    });
  }

  async pushHistory(roomNumber: number, mode: number) {
    let gameModeselector: string;

    if (mode == 0) {
      gameModeselector = "랭크";
    } else if (mode == 1) {
      gameModeselector = "일반";
    } else if (mode == 2) {
      gameModeselector = "일반-포탈";
    } else {
      gameModeselector = "unknown";
    }
    const historyDtoTmp: HistoryDto = {
      player1score: roomManager.get(roomNumber).score[0],
      player2score: roomManager.get(roomNumber).score[1],
      player1: "",
      player2: "",
      gameMode: gameModeselector,
    };

    this.matchHistorysService.putHistory(historyDtoTmp, getUser.get(roomNumber)[0], getUser.get(roomNumber)[1]);
    await this.channelService.deleteChannelByChannelName("game" + roomNumber);
    console.log("add history");
  }

  async updateGameInfo(user: User, WinLose: number, isRank: number) {
    if (isRank == 0) {
      if (WinLose > 0) {
        user.lating += 15;
        user.ladder_win++;
      } else {
        user.lating -= 10;
        user.ladder_lose++;
      }
      await this.userService.updateLadderGameRecord(user);
    } else {
      if (WinLose > 0) {
        user.win++;
      } else {
        user.lose++;
      }
      await this.userService.updateNormalGameRecord(user);
    }
    console.log("updat user info");
  }

  async gameResultProcess(gameData: GameData, room: number) {
    const winLose = gameData.score[0] - gameData.score[1];
    const isRank = room % 2;
    let user = getUser.get(room);

    await this.updateGameInfo(user[0], winLose, isRank);
    await this.updateGameInfo(user[1], winLose * -1, isRank);
  }

  async checkUserSet(roomNum: number): Promise<[boolean, boolean]> {
    const tmp = getPlayerWithRoomnum.get(roomNum);
    let result: [boolean, boolean] = [false, false];
    if (tmp[0] != "") {
      result[0] = true;
    } else {
      result[0] = false;
    }
    if (tmp[1] != "") {
      result[1] = true;
    } else {
      result[1] = false;
    }

    return result;
    // this.server.to(roomNum.toString()).emit("allUserSet", result);
  }

  async deleteProcess(@ConnectedSocket() client, roomNum: number, userLeft: string, userright: string, connectedNickName: string) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);

    if (roomList.has(roomNum)) {
      roomList.get(roomNum).person--;
      roomList.get(roomNum).participation = true;
    }
    if (connectedNickName == userLeft) {
      getPlayerWithRoomnum.get(roomNum)[0] = "";
      getRoomNumWithID.delete(user.id);
      // getUser.get(roomNum)[0] = undefined;
      if (roomNum % 2) {
        checkReady.get(roomNum)[0] = false;
        checkReady.get(roomNum)[1] = false;
        checkStart.get(roomNum)[0] = false;
        checkStart.get(roomNum)[1] = false;

        this.server.to(roomNum.toString()).emit("usersReadySet", checkReady.get(roomNum));
      }
    } else if (connectedNickName == userright) {
      getPlayerWithRoomnum.get(roomNum)[1] = "";
      getRoomNumWithID.delete(user.id);
      // getUser.get(roomNum)[1] = undefined;
      if (roomNum % 2) {
        /**일단 보류 */
        // checkReady.set(roomNum, [false,false]);
        checkReady.get(roomNum)[0] = false;
        checkReady.get(roomNum)[1] = false;
        checkStart.get(roomNum)[0] = false;
        checkStart.get(roomNum)[1] = false;

        this.server.to(roomNum.toString()).emit("usersReadySet", checkReady.get(roomNum));
      }
    }

    // let userSetTemp = await this.checkUserSet(roomNum);
    this.server.to(roomNum.toString()).emit("allUserSet", await this.checkUserSet(roomNum));

    client.leave(roomNum.toString());

    /**플레이어가 없는 경우 */
    if (getPlayerWithRoomnum.get(roomNum)[0] == "" && getPlayerWithRoomnum.get(roomNum)[1] == "") {
      /**방에 있는 소켓 전부 leave */
      // this.server.in(roomNum.toString()).socketsLeave(roomNum.toString());

      /**해당 방에 있는 유저(관전자 포함) 정보 삭제 */
      // getRoomNumWithNick.forEach((value, key) => {
      //   if (value == roomNum) getRoomNumWithNick.delete(key);
      // });

      /**해당 방의 플레이어 정보 삭제 */
      getPlayerWithRoomnum.delete(roomNum);

      /**해당 방 게임정보 삭제 */
      roomManager.delete(roomNum);

      /**해당 방 user정보 삭제 */
      getUser.delete(roomNum);

      /**roomList 에서 방정보 삭제, 프론트에 갱신*/
      roomList.delete(roomNum);

      /**방관련 데이터 삭제 */
      checkStart.delete(roomNum);
      //   saveSocketWithRomm.delete(roomNum);
      if (roomNum % 2) {
        checkReady.delete(roomNum);
      }
    }
    this.server.emit("roomList", JSON.stringify(Array.from(roomList)));
  }

  /**몰수 처리 */
  async ConfiscationProcess(roomNum: number, userLeft: string, userright: string, connectedNickName: string) {
    let gameData = roomManager.get(roomNum);

    /**게임중 일 때 => DB에 결과 반영까지 해야됨*/
    if (gameData.onGame) {
      gameData.onGame = false;
      if (connectedNickName == userLeft) {
        gameData.score = [0, finishScore + 1];
      } else if (connectedNickName == userright) {
        gameData.score = [finishScore + 1, 0];
      }
      // this.server.to(roomNum.toString()).emit("gameData", gameData);
      this.server.to(roomNum.toString()).emit("finished", gameData.score);
      await this.pushHistory(roomNum, gameData.mode);
      await this.gameResultProcess(gameData, roomNum);
      gameData.score = [0, 0];
      gameData.reset();
      if (roomNum % 2) {
        checkReady.get(roomNum)[0] = false;
        checkReady.get(roomNum)[1] = false;
      }
    }
  }

  async disconnectProcess(@ConnectedSocket() client, roomNum: number, userLeft: string, userright: string, connectedNickName: string) {
    /**몰수처리 */
    await this.ConfiscationProcess(roomNum, userLeft, userright, connectedNickName);

    //**async 이기 때문에 ConfiscationProcess 순서 보장 해 줄 필요 있을 것 같음. */
    this.deleteProcess(
      client,
      roomNum,
      userLeft,
      userright,
      connectedNickName
      // gameData
    );
  }

  async handleDisconnect(@ConnectedSocket() client) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);
    console.log("leave game : " + user.nickname);
    //방 퇴장 수정 필요. 플레이어면 방 폭파, 관전자면 관전자만 퇴장.
    let roomNum = getRoomNumWithID.get(user.id);
    //disconnect시 자동으로 방 나가지는지 확인. 안나가지면 수동으로 추방.

    /**플레이어가 disconnect된 경우 해당 방 관련 정보 모두 삭제되기 때문에 나머지socket들 disconnect시 처리 안하도록 undefinde인지 체크 */
    if (roomNum != undefined) {
      const connectedNickName = user.nickname;
      let userLeft = "";
      let userright = "";
      await this.statusHandler(user, UserStatusType.ONLINE);
      const findIndex = getUserList.get(roomNum).findIndex((item) => item.id === user.id);
      if (findIndex !== -1) getUserList.get(roomNum).splice(findIndex, 1);
      this.server.to(roomNum.toString()).emit("AllUserList", {
        data: getUserList.get(roomNum),
      });
      if (getPlayerWithRoomnum.has(roomNum)) {
        userLeft = getPlayerWithRoomnum.get(roomNum)[0];
        userright = getPlayerWithRoomnum.get(roomNum)[1];
      }

      if (
        /**플레이어인지 관전자인지 확인 */
        connectedNickName == userLeft ||
        connectedNickName == userright
      ) {
        //**플레이어일 경우 */
        await this.disconnectProcess(client, roomNum, userLeft, userright, connectedNickName);
      } else {
        /**관전자일 경우 */
        client.leave(roomNum.toString());
        getRoomNumWithID.delete(user.id);
        if (roomList.has(roomNum)) {
          roomList.get(roomNum).person--;
          this.server.emit("roomList", JSON.stringify(Array.from(roomList)));
        } else if (roomNum % 2) {
          console.log("If see this, please talk to yuchoi your log. (it's normalGame and no roomlist case.)");
          this.server.to(roomNum.toString()).emit("noticeRejectBattle");
        }
      }
    }
  }

  /* 유저가 보낸 jwt로부터 userid를 수동으로 파싱해옴 */
  private async getUserId(@ConnectedSocket() client) {
    /********* 암시적인 에러 발생 가능 부분********/
    try {
      let haha = String(client.handshake.headers.authorization);
      haha = haha.replace("Bearer ", "");
      /*********************************************/
      const user: TMP = await this.authService.jwtVerify(haha);
      return user.id;
    } catch (e) {}
  }

  /**게임 채팅. id는 -1 이거나 없거나. data[방번호, Chat인터페이스]*/
  @SubscribeMessage("gameChat")
  async gameChat(@MessageBody() data: Chat) {
    this.server.to(data.channel_id.toString()).emit("message", data);
  }

  normalRoomSettings(roomNum: number, user: User, mode: number) {
    getPlayerWithRoomnum.set(roomNum, ["", ""]);
    getRoomNumWithID.set(user.id, roomNum);
    getUser.set(roomNum, [undefined, undefined]);
    checkReady.set(roomNum, [false, false]);
    checkStart.set(roomNum, [false, false]);

    let gameTemp: GameData = new GameData();
    gameTemp.setMode(mode);
    roomManager.set(roomNum, gameTemp);
  }

  checkAbailableGame(user: User): boolean {
    console.log("checkAbailableGame: ", getRoomNumWithID.has(user.id));
    if (getRoomNumWithID.has(user.id)) {
      return false;
    }
    return true;
  }
  /**대결신청 data[gameMode, 상대방nick], 신청하자마자 status = game 으로 할지 정해야 함.*/
  @SubscribeMessage("throwGauntlet")
  async throwGauntlet(
    @ConnectedSocket() client,
    @MessageBody()
    opponentID: string
  ) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);

    let opponen = await this.userService.getUserById(opponentID);
    if (this.checkAbailableGame(opponen)) {
      const roomNumTmp = normalRoom;
      normalRoom += 2;

      /**상대방 닉네임도 세팅. 대결 거절시 삭제해야됨.*/
      getRoomNumWithID.set(opponen.id, roomNumTmp);

      this.normalRoomSettings(roomNumTmp, user, 1);
      /**자기자신 */
      client.emit("vsbattle");
      /**상대방 */
      this.loginUserGateway.recvBattle(opponen, user.nickname, user.id);
    } else {
      client.emit("canNotAvailableGame");
    }
  }

  /**대결수락 */
  @SubscribeMessage("acceptBattle")
  async acceptBattle(@ConnectedSocket() client) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);

    const right = user.nickname;
    const roomNum = getRoomNumWithID.get(user.id);
    if (getPlayerWithRoomnum.has(roomNum) && getPlayerWithRoomnum.get(roomNum)[0] != "") {
      const left = getPlayerWithRoomnum.get(roomNum)[0];
      let roomData: RoomData = {
        name: left + " vs " + right,
        pass: "",
        mode: roomManager.get(roomNum).mode,
        person: 2,
        id: roomNum,
        secret: false,
        participation: false,
      };
      roomList.set(roomNum, roomData);
      client.emit("vsbattle");
      this.server.emit("roomList", JSON.stringify(Array.from(roomList)));
    } else {
      getRoomNumWithID.delete(user.id);
      client.emit("canNotAvailableGame");
    }
  }

  /**대결거절 */
  @SubscribeMessage("rejectBattle")
  async rejectBattle(@ConnectedSocket() client) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);

    const roomNum = getRoomNumWithID.get(user.id);
    if (roomNum !== undefined) {
      getRoomNumWithID.delete(user.id);

      // roomManager.get(roomNum).onGame = false;
      /**battleVue 에서 이벤트 수신 */
      this.server.to(roomNum.toString()).emit("noticeRejectBattle");
    }
  }

  @SubscribeMessage("rankBattle")
  async rankBattle(@ConnectedSocket() client) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);

    /**status 변경 */
    await this.statusHandler(user, UserStatusType.GAME);
    /**게임 채팅 참여 유저 목록 */
    if (!getUserList.has(rankRoom)) {
      getUserList.set(rankRoom, new Array<User>());
    }
    getUserList.get(rankRoom).push(user);
    /**접족한 client를 socket room에 연결 */
    client.join(rankRoom.toString());
    this.server.to(rankRoom.toString()).emit("AllUserList", {
      data: getUserList.get(rankRoom),
    });
    if (getPlayerWithRoomnum.get(rankRoom) == undefined) {
      /**첫번째 유저 */

      console.log(`client join room ${rankRoom.toString()}`);
      getPlayerWithRoomnum.set(rankRoom, [user.nickname, ""]);
      getRoomNumWithID.set(user.id, rankRoom);
      getUser.set(rankRoom, [user, undefined]);

      checkStart.set(rankRoom, [false, false]);
      console.log("in rank: ", checkStart.get(rankRoom));

      /**유저에게 paddle번호 부여 */
      client.emit("getPaddle", [1, rankRoom, 0]);
      // client.emit("getRoomNum", rankRoom);

      let tmp = new GameData();
      roomManager.set(rankRoom, tmp);
    } else {
      getUser.get(rankRoom)[1] = user;

      /* 게임용 채널 생성 */
      // let dto = new CreateChannelDto();
      // dto.name = "game" + String(rankRoom);
      // dto.ownerId = user;
      // dto.password = "";
      // dto.type = "game";
      // let channel = await this.channelService.makeChannel(dto, user);
      // this.chatGateway.gameChatRoomJoin(getUser.get(rankRoom)[0].id, "game" + String(rankRoom));
      // this.chatGateway.deligateEventSend(getUser.get(rankRoom)[0].id, "EnterGame", channel);
      // this.chatGateway.gameChatRoomJoin(getUser.get(rankRoom)[1].id, "game" + String(rankRoom));
      // this.chatGateway.deligateEventSend(getUser.get(rankRoom)[1].id, "EnterGame", channel);

      /**두번째 유저 */
      client.emit("getPaddle", [2, rankRoom, 0]);

      getPlayerWithRoomnum.get(rankRoom)[1] = user.nickname;

      getRoomNumWithID.set(user.id, rankRoom);

      /** 게임 채팅 */
      // this.server.to(rankRoom.toString()).emit("ChattingChange", rankRoom);

      /**닉네임 보내기 */
      this.server.to(rankRoom.toString()).emit("getPlayers", getPlayerWithRoomnum.get(rankRoom));

      roomManager.get(rankRoom).onGame = true;
      // let userSetTemp = await this.checkUserSet(rankRoom);
      this.server.to(rankRoom.toString()).emit("allUserSet", await this.checkUserSet(rankRoom));

      rankRoom += 2;
    }
  }

  @SubscribeMessage("normalBattle")
  async normalBattle(@ConnectedSocket() client) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);
    let ownRoomNum: number = getRoomNumWithID.get(user.id);

    /**status 변경 */
    await this.statusHandler(user, UserStatusType.GAME);
    /**게임 채팅 참여 유저 목록 */
    if (!getUserList.has(ownRoomNum)) {
      getUserList.set(ownRoomNum, new Array<User>());
    }
    getUserList.get(ownRoomNum).push(user);
    /**접족한 client를 socket room에 연결 */
    client.join(ownRoomNum.toString());
    this.server.to(ownRoomNum.toString()).emit("AllUserList", {
      data: getUserList.get(ownRoomNum),
    });

    if (getPlayerWithRoomnum.get(ownRoomNum)[0] == "") {
      getPlayerWithRoomnum.get(ownRoomNum)[0] = user.nickname;
      getUser.get(ownRoomNum)[0] = user;

      client.emit("getPaddle", [1, ownRoomNum, roomManager.get(ownRoomNum).mode]);

      /**닉네임 보내기 */
      this.server.to(ownRoomNum.toString()).emit("getPlayers", getPlayerWithRoomnum.get(ownRoomNum));

      this.server.to(ownRoomNum.toString()).emit("allUserSet", await this.checkUserSet(ownRoomNum));
    } else if (getPlayerWithRoomnum.get(ownRoomNum)[1] == "") {
      getPlayerWithRoomnum.get(ownRoomNum)[1] = user.nickname;
      getUser.get(ownRoomNum)[1] = user;

      client.emit("getPaddle", [2, ownRoomNum, roomManager.get(ownRoomNum).mode]);

      /**닉네임 보내기 */
      this.server.to(ownRoomNum.toString()).emit("getPlayers", getPlayerWithRoomnum.get(ownRoomNum));

      this.server.to(ownRoomNum.toString()).emit("allUserSet", await this.checkUserSet(ownRoomNum));
    } else {
      client.emit("getPaddle", [3, ownRoomNum, roomManager.get(ownRoomNum).mode]);

      //////////////////////////////////////
      // client.emit("getRoomNum", ownRoomNum);
      client.emit("getPlayers", getPlayerWithRoomnum.get(ownRoomNum));
      client.emit("usersReadySet", checkReady.get(ownRoomNum));

      client.emit("allUserSet", await this.checkUserSet(ownRoomNum));
    }
  }

  /**client의 방 생성 요청 */
  @SubscribeMessage("submitRoomData")
  async makeRoom(
    @ConnectedSocket() client,
    @MessageBody()
    data: RoomData
  ) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);

    const roomNumTmp = normalRoom;
    normalRoom += 2;

    this.normalRoomSettings(roomNumTmp, user, data.mode);
    /**normalRoomSettings으로 대체 */
    // getPlayerWithRoomnum.set(normalRoom, ["", ""]);
    // getRoomNumWithNick.set(user.nickname, normalRoom);
    // getUser.set(normalRoom, [undefined, undefined]);
    // checkReady.set(normalRoom, [false, false]);
    // checkStart.set(normalRoom, [false, false]);

    /**받아온 data를 id(방번호)만 수정하여 그대로 사용 가능 할 듯 */
    let roomData: RoomData = {
      name: data.name,
      pass: data.pass,
      mode: data.mode,
      person: 1,
      id: roomNumTmp,
      secret: data.secret,
      participation: true,
    };
    const salt = await bcrypt.genSalt();
    roomData.pass = await bcrypt.hash(data.pass, salt);
    roomList.set(roomNumTmp, roomData);

    /**생성된 room 포함된 list client측 정보 갱신. */
    this.server.emit("roomList", JSON.stringify(Array.from(roomList)));

    /**normalRoomSettings으로 대체 */
    // let gameTemp: GameData = new GameData();
    // gameTemp.setMode(data.mode);
    // roomManager.set(roomNumTmp, gameTemp);

    client.emit("done");
  }

  /**방 입장 버튼 클릭 시 입장 요청 */
  @SubscribeMessage("enterRoom")
  async enterRoom(
    @ConnectedSocket() client,
    @MessageBody()
    data: [number, string]
  ) {
    /**data [roomNum, pass] */
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);
    let room = roomList.get(data[0]);

    if (room.pass == "" || (await bcrypt.compare(data[1], room.pass))) {
      getRoomNumWithID.set(user.id, data[0]);
      room.person++;
      room.participation = false;
      this.server.emit("roomList", JSON.stringify(Array.from(roomList)));

      client.emit("passSuccess");
    } else client.emit("passError");
  }
  /**관전 요청 */
  @SubscribeMessage("watchGame")
  async watchGame(
    @ConnectedSocket() client,
    @MessageBody()
    targetID: string
  ) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);

    let target = await this.userService.getUserById(targetID);

    const roomNum = getRoomNumWithID.get(target.id);
    if (roomNum != undefined) {
      getRoomNumWithID.set(user.id, roomNum);

      client.emit("watchGame", roomNum);
    } else {
      client.emit("noExitGame");
    }
  }

  /**관전자의 BattleVue로 이동후 이벤트 */
  @SubscribeMessage("watchBattle")
  async watchBattle(@ConnectedSocket() client) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);

    /**status 변경 */
    await this.statusHandler(user, UserStatusType.GAME);

    /**게임 채팅 참여 유저 목록 */
    const roomNum = getRoomNumWithID.get(user.id);
    client.join(roomNum.toString());

    getUserList.get(roomNum).push(user);
    this.server.to(roomNum.toString()).emit("AllUserList", {
      data: getUserList.get(roomNum),
    });

    if (roomList.has(roomNum)) {
      roomList.get(roomNum).person++;
      this.server.emit("roomList", JSON.stringify(Array.from(roomList)));
    }

    client.emit("getPaddle", [3, roomNum, roomManager.get(roomNum).mode]);
    client.emit("getPlayers", getPlayerWithRoomnum.get(roomNum));
    if (roomNum % 2) {
      client.emit("usersReadySet", checkReady.get(roomNum));
    }
    // let userSetTemp = await this.checkUserSet(roomNum);
    client.emit("allUserSet", await this.checkUserSet(roomNum));
  }

  /**client의 room list 요청 이벤트. */
  @SubscribeMessage("requestRoomList")
  async requestRoomList(@ConnectedSocket() client) {
    client.emit("roomList", JSON.stringify(Array.from(roomList)));
  }
  /**일반게임 게임모드 바꾸는 이벤트 */
  @SubscribeMessage("changeMode")
  async changeMode(@MessageBody() data: [number, number]) {
    roomManager.get(data[0]).mode = data[1];
    this.server.to(data[0].toString()).emit("modeChanged", data[1]);
  }

  /**방 나가기. 삭제될 코드*/
  @SubscribeMessage("leaveGame")
  async leaveGame(@ConnectedSocket() client, @MessageBody() roomNum: number) {
    // let user_id = await this.getUserId(client);
    // let user = await this.userService.getUserById(user_id);
    // const roomNum = getRoomNumWithNick.get(user.nickname);
    const players = getPlayerWithRoomnum.get(roomNum);

    /**소켓 disconnect로 처리 됨. */
    // this.deleteProcess(client, roomNum, players[0], players[1], user.nickname);
  }

  /**기권. 방 번호 주는게 좋음*/
  @SubscribeMessage("giveUpGame")
  async giveUpGame(@ConnectedSocket() client, @MessageBody() roomNum: number) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);
    // const roomNum = getRoomNumWithNick.get(user.nickname);
    const players = getPlayerWithRoomnum.get(roomNum);

    await this.ConfiscationProcess(roomNum, players[0], players[1], user.nickname);

    /**소켓 disconnect로 처리 됨. */
    // this.deleteProcess(client, roomNum, players[0], players[1], user.nickname);
  }

  //**준비, 취소.  방 번호 주는게 좋음 */
  @SubscribeMessage("setReady")
  async setReady(@ConnectedSocket() client, @MessageBody() roomNum: number) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);
    // const roomNum = getRoomNumWithNick.get(user.nickname);
    const players = getPlayerWithRoomnum.get(roomNum);

    if (players[0] == user.nickname) {
      checkReady.get(roomNum)[0] = true;
    } else if (players[1] == user.nickname) {
      checkReady.get(roomNum)[1] = true;
    }
    this.server.to(roomNum.toString()).emit("usersReadySet", checkReady.get(roomNum));
    if (checkReady.get(roomNum)[0] && checkReady.get(roomNum)[1]) {
      roomManager.get(roomNum).onGame = true;
      this.server.to(roomNum.toString()).emit("allReady");
    }
  }

  @SubscribeMessage("cancleReady")
  async cancleReady(@ConnectedSocket() client, @MessageBody() roomNum: number) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);
    // const roomNum = getRoomNumWithNick.get(user.nickname);
    const players = getPlayerWithRoomnum.get(roomNum);

    if (players[0] == user.nickname) {
      checkReady.get(roomNum)[0] = false;
    } else if (players[1] == user.nickname) {
      checkReady.get(roomNum)[1] = false;
    }
    this.server.to(roomNum.toString()).emit("usersReadySet", checkReady.get(roomNum));
  }

  //**두명의 클라이언트의 스타트신호를 확인 후 게임 시작.  방 번호 주는게 좋음*/
  @SubscribeMessage("startGame")
  async startGame(@ConnectedSocket() client, @MessageBody() data: [number, number]) {
    let user_id = await this.getUserId(client);
    let user = await this.userService.getUserById(user_id);
    const roomNum = data[0];

    if (data[1] == 1) {
      checkStart.get(roomNum)[0] = true;
    } else if (data[1] == 2) {
      checkStart.get(roomNum)[1] = true;
    }
    roomManager.get(roomNum).onGame = true;

    if (checkStart.get(roomNum)[0] && checkStart.get(roomNum)[1]) {
      this.server.to(roomNum.toString()).emit("startBattle", {
        nicks: getPlayerWithRoomnum.get(roomNum),
        roomNum: roomNum,
        users: getUser.get(roomNum),
      });
      checkStart.get(roomNum)[0] = false;
      checkStart.get(roomNum)[1] = false;
    }
  }

  /**갱신된 paddle위치 수신, 게임 정보 갱신, 갱신된 정보 송신 */
  @SubscribeMessage("paddleDeliver")
  async sendGameData(
    @MessageBody()
    data: {
      paddleSide: number;
      paddlePos: number;
      roomNum: string;
      roomIntNum: number;
    },
    @ConnectedSocket() client
  ) {
    if (roomManager.has(data.roomIntNum)) {
      let gameData = roomManager.get(data.roomIntNum);
      /**각각의 paddle 위치 갱신. */
      if (data.paddleSide == 1) {
        gameData.left_user = data.paddlePos;
      } else {
        gameData.right_user = data.paddlePos;
      }

      /**클레스의 맴버함수 update함수 이용. */
      gameData.update();

      /**목표 점수 도달시 처리. */
      if ((gameData.score[0] == finishScore || gameData.score[1] == finishScore) && gameData.onGame) {
        // this.server.to(data.roomNum).emit("gameData", gameData);
        this.server.to(data.roomNum).emit("finished", gameData.score);
        gameData.onGame = false;
        await this.pushHistory(data.roomIntNum, gameData.mode);
        await this.gameResultProcess(gameData, data.roomIntNum);
        gameData.score = [0, 0];
        if (Number(data.roomNum) % 2) {
          checkReady.get(Number(data.roomNum))[0] = false;
          checkReady.get(Number(data.roomNum))[1] = false;
        }
      } else if (!gameData.onGame) {
        client.emit("finished", gameData.score);
      } else {
        /**client가 속한 room에 게임정보 송신. */
        this.server.to(data.roomNum).emit("gameData", gameData);
      }
    }
  }
}
