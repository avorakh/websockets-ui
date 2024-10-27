import { PlayerClientService, PlayerClient } from './ws_client_svc.js';
import { WinnerService, PlayerWinnerResult } from './winner_svc.js';
import { Room, RoomService } from './room_svc.js';
import { WebSocket } from 'ws';

export interface WebSocketEventSender {
    sendUpdateRoomEvent(): Promise<void>;
    sendUpdateWinnersEvent(): Promise<void>;
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