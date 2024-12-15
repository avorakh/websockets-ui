import { PlayerClientService, PlayerClient } from './ws_client_svc.js';
import { WinnerService, PlayerWinnerResult } from './winner_svc.js';
import { Room, RoomService } from './room_svc.js';
import { WebSocket } from 'ws';
import { GamePlayer, AttackResults } from './geme_svc.js';

export interface WebSocketEventSender {
    sendUpdateRoomEvent(): Promise<void>;
    sendUpdateWinnersEvent(): Promise<void>;
    sendCreateGameEvent(players: GamePlayer[]): Promise<void>;
    sendStartGameEvent(players: GamePlayer[]): Promise<void>;
    sendFinishGameEvent(players: GamePlayer[], playerId: string): Promise<void>;
    sendTurnEvent(players: GamePlayer[], playerId: string): Promise<void>;
    sendAttackEvent(players: GamePlayer[], result: AttackResults): Promise<void>;
}

export class SimpleWebSocketEventSender implements WebSocketEventSender {

    private roomService: RoomService;
    private playerClientSvc: PlayerClientService;
    private winnerService: WinnerService;

    constructor(roomService: RoomService, playerClientSvc: PlayerClientService, winnerService: WinnerService) {
        this.roomService = roomService;
        this.playerClientSvc = playerClientSvc;
        this.winnerService = winnerService;
    }




    async sendUpdateRoomEvent(): Promise<void> {
        let foundSingleUserRoom: Room[] = await this.roomService.getSingleUserRooms();
        let updateRoomEvent: string = this.toEvent('update_room', JSON.stringify(foundSingleUserRoom));
        let availableClient: PlayerClient[] = this.findAllOpenClients();
        availableClient.forEach(client => this.send(client.ws, client.id, updateRoomEvent));
    }

    async sendUpdateWinnersEvent(): Promise<void> {
        let result: PlayerWinnerResult[] = await this.winnerService.getAllWinners();
        let updateWinnersEvent: string = this.toEvent('update_winners', JSON.stringify(result));
        let availableClient: PlayerClient[] = this.findAllOpenClients();
        availableClient.forEach(client => this.send(client.ws, client.id, updateWinnersEvent));
    }

    async sendCreateGameEvent(players: GamePlayer[]): Promise<void> {

        players.forEach(player => {
            let foundClient = this.playerClientSvc.findByPlayer(player.player);
            if (foundClient) {
                let eventData: string = JSON.stringify({
                    idGame: player.idGame,
                    idPlayer: player.playerId
                });
                let createGameEvent = this.toEvent("create_game", eventData);
                this.send(foundClient.ws, foundClient.id, createGameEvent);
            } else {
                console.error(`Unable to send the 'create_game' event to player - [${JSON.stringify(player)}]`);
            }
        });
    }


    async sendStartGameEvent(players: GamePlayer[]): Promise<void> {
        players.forEach(player => {
            let foundClient = this.playerClientSvc.findByPlayer(player.player);
            if (foundClient) {
                let eventData: string = JSON.stringify({
                    idGame: player.idGame,
                    indexPlayer: player.playerId,
                    ships: player.ships
                });
                let createGameEvent = this.toEvent("start_game", eventData);
                this.send(foundClient.ws, foundClient.id, createGameEvent);
            } else {
                console.error(`Unable to send the 'start_game' event to player - [${JSON.stringify(player)}]`);
            }
        });
    }

    async sendTurnEvent(players: GamePlayer[], playerId: string): Promise<void> {
        players.forEach(player => {
            let foundClient = this.playerClientSvc.findByPlayer(player.player);
            if (foundClient) {
                let eventData: string = JSON.stringify({
                    currentPlayer: playerId
                });
                let createGameEvent = this.toEvent("turn", eventData);
                this.send(foundClient.ws, foundClient.id, createGameEvent);
            } else {
                console.error(`Unable to send the 'turn' event to player - [${JSON.stringify(player)}]`);
            }
        });
    }

    async sendAttackEvent(players: GamePlayer[], result: AttackResults): Promise<void> {
        players.forEach(player => {
            let foundClient = this.playerClientSvc.findByPlayer(player.player);
            if (foundClient) {
                let eventData: string = JSON.stringify(result);
                let createGameEvent = this.toEvent("attack", eventData);
                this.send(foundClient.ws, foundClient.id, createGameEvent);
            } else {
                console.error(`Unable to send the 'attack' event to player - [${JSON.stringify(player)}]`);
            }
        });
    }

    async sendFinishGameEvent(players: GamePlayer[], playerId: string): Promise<void> {
        players.forEach(player => {
            let foundClient = this.playerClientSvc.findByPlayer(player.player);
            if (foundClient) {
                let eventData: string = JSON.stringify({
                    winPlayer: playerId
                });
                let createGameEvent = this.toEvent("finish", eventData);
                this.send(foundClient.ws, foundClient.id, createGameEvent);
            } else {
                console.error(`Unable to send the 'finish' event to player - [${JSON.stringify(player)}]`);
            }
        });
    }



    private send(ws: WebSocket, clientId: string, msg: string): void {

        console.log(`Result was sent to [${clientId}] clientId: ${msg}`);
        ws.send(msg);
    }

    private findAllOpenClients(): PlayerClient[] {
        return this.playerClientSvc.findAll().filter(client => client.ws.readyState === WebSocket.OPEN);
    }

    private toEvent(eventType: string, dataValue: string, event_id: number = 0): string {
        return JSON.stringify({
            type: eventType,
            data: dataValue,
            id: event_id
        });
    }
}