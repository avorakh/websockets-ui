import { WebSocket } from 'ws';
import { Command } from '../command/commands.js';
import { CommandHandler } from './command_svc.js';
import { RoomService } from './room_svc.js';
import { PlayerClientService } from './ws_client_svc.js';
import { WebSocketEventSender } from './event_sender.js';

export class AddRoomCommandHandler implements CommandHandler {

    private roomSvc: RoomService;
    private playerClientSvc: PlayerClientService;
    private eventSender: WebSocketEventSender;


    constructor(roomSvc: RoomService, playerClientSvc: PlayerClientService, eventSender: WebSocketEventSender) {
        this.roomSvc = roomSvc;
        this.playerClientSvc = playerClientSvc;
        this.eventSender = eventSender
    }

    canHandle(command: Command): boolean {
        return command.type === 'create_room'
    }

    async handle(command: Command, ws: WebSocket, clientId: string): Promise<void> {

        let foundClient = this.playerClientSvc.find(clientId);
        if (foundClient && foundClient.player) {

            await this.roomSvc.addRoom(foundClient.player);
            this.eventSender.sendUpdateRoomEvent();
        } else {
            console.error(`The command cannot be handled - [${command}]`);
        }
    }
}