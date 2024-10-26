import { WebSocket } from 'ws';
import { Command, CommandResponse } from '../command/commands.js';
import { CommandHandler } from './command_svc.js';
import { Room, RoomService } from './room_svc.js';
import { PlayerClientService } from './ws_client_svc.js';

export class AddRoomCommandHandler implements CommandHandler {

    private roomSvc: RoomService;
    private playerClientSvc: PlayerClientService;

    constructor(roomSvc: RoomService, playerClientSvc: PlayerClientService) {
        this.roomSvc = roomSvc;
        this.playerClientSvc = playerClientSvc;
    }

    canHandle(command: Command): boolean {
        return command.type === 'create_room'
    }

    async handle(command: Command, ws: WebSocket, clientId: string): Promise<void> {

        let foundClient = this.playerClientSvc.find(clientId);
        if (foundClient && foundClient.player) {

            await this.roomSvc.addRoom(foundClient.player);
            this.sendUpdateRoomEvent(ws);
        } else {
            console.error(`The command cannot be handled - [${command}]`);
        }
    }

    private async sendUpdateRoomEvent(ws: WebSocket): Promise<void> {
        let foundSingleUserRoom: Room[] = await this.roomSvc.getSingleUserRooms();

        this.send(ws, 'update_room', JSON.stringify(foundSingleUserRoom));
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