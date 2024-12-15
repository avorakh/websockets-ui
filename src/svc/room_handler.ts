import { WebSocket } from 'ws';
import { Command } from '../command/commands.js';
import { CommandHandler } from './command_svc.js';
import { RoomService, Room } from './room_svc.js';
import { PlayerClientService } from './ws_client_svc.js';
import { WebSocketEventSender } from './event_sender.js';
import { GameService, Ship } from './geme_svc.js';

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

export interface RoomIndex {
    indexRoom: string
}

const toRoomIndex = (msg: string): string => {
    let obj = JSON.parse(msg);
    return obj.indexRoom;
}

export class AddUserToRoomCommandHandler implements CommandHandler {

    private roomSvc: RoomService;
    private playerClientSvc: PlayerClientService;
    private eventSender: WebSocketEventSender;
    private gameService: GameService;


    constructor(roomSvc: RoomService, playerClientSvc: PlayerClientService, eventSender: WebSocketEventSender, gameService: GameService) {
        this.roomSvc = roomSvc;
        this.playerClientSvc = playerClientSvc;
        this.eventSender = eventSender;
        this.gameService = gameService;
    }

    canHandle(command: Command): boolean {
        return command.type === 'add_user_to_room'
    }

    async handle(command: Command, ws: WebSocket, clientId: string): Promise<void> {
        let foundClient = this.playerClientSvc.find(clientId);
        let roomId = toRoomIndex(command.data)
        if (foundClient && foundClient.player) {

            let room = await this.roomSvc.updateRoom(roomId, foundClient.player);
            if (room) {
                this.eventSender.sendUpdateRoomEvent();
                this.gameService.createGame(room);
            } else {
                console.error(`Unable update  room - [${roomId}] for  client- [${clientId}]`);
            }

        } else {
            console.error(`The command cannot be handled - [${command}]`);
        }
    }

}


export interface AddShips {
    gameId: string,
    indexPlayer: string
    ships: Ship[]
}

const toAddShips = (msg: string): AddShips => {
    let event: AddShips = JSON.parse(msg)
    return event;
}

export class AddShipsCommandHandler implements CommandHandler {
    private gameService: GameService;
    constructor(gameService: GameService) {
        this.gameService = gameService;
    }

    canHandle(command: Command): boolean {
        return command.type === 'add_ships'
    }

    async handle(command: Command, ws: WebSocket, clientId: string): Promise<void> {
        let addShipsEvent: AddShips = toAddShips(command.data);
        this.gameService.addShips(addShipsEvent.gameId, addShipsEvent.indexPlayer, addShipsEvent.ships);
    }
} 