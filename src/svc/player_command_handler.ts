import { WebSocket } from 'ws';
import { Command, CommandResponse } from '../command/commands.js';
import { CommandHandler } from './command_svc.js';
import { Player, UserService } from './user_svc.js';
import { PlayerClientService } from './ws_client_svc.js';
import { WinnerService } from './winner_svc.js';
import { WebSocketEventSender } from './event_sender.js';

export interface UserLogin {
    name: string;
    password: string;
}

const toUserLogin = (msg: string): UserLogin => {
    let userLogin = JSON.parse(msg);
    return userLogin;
}


export class PlayerCommandHandler implements CommandHandler {

    private userService: UserService;
    private playerClientSvc: PlayerClientService;
    private winnerService: WinnerService;
    private eventSender: WebSocketEventSender;


    constructor(userService: UserService, playerClientSvc: PlayerClientService, winnerService: WinnerService, eventSender: WebSocketEventSender) {
        this.userService = userService;
        this.playerClientSvc = playerClientSvc;
        this.winnerService = winnerService;
        this.eventSender = eventSender;
    }

    canHandle(command: Command): boolean {
        return command.type === 'reg'
    }

    async handle(command: Command, ws: WebSocket, clientId: string): Promise<void> {

        let userLogin = toUserLogin(command.data);

        let foundPlayer = await this.userService.loginOrCreate(userLogin);
        let responseData: string;
        if (foundPlayer) {
            this.playerClientSvc.assign(clientId, foundPlayer);
            await this.sendRegEvent(ws, foundPlayer);
            await this.winnerService.addPlayer(foundPlayer.name);
            this.eventSender.sendUpdateRoomEvent();
            this.eventSender.sendUpdateWinnersEvent();
        } else {
            responseData = JSON.stringify({
                error: true,
                errorText: "User not found or Invalid credentials",
            });
            this.send(ws, command.type, responseData);
        }
    }

    private async sendRegEvent(ws: WebSocket, player: Player): Promise<void> {
        let responseData = JSON.stringify(player);

        this.send(ws, 'reg', responseData);
    }

    private send(ws: WebSocket, eventType: string, dataValue: string, event_id: number = 0): void {
        let msg = this.toMessage({
            type: eventType,
            data: dataValue,
            id: event_id
        });
        console.log(`Result: ${msg}`);
        ws.send(msg);
    }

    toMessage(commandResponse: CommandResponse): string {
        return JSON.stringify(commandResponse);
    }
}