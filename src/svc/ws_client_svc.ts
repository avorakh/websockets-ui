import { WebSocket } from 'ws';
import { Player } from './user_svc.js';

export interface PlayerClient {
    id: string,
    ws: WebSocket,
    player: Player | undefined
}

export interface PlayerClientService {
    add(clientId: string, websocket: WebSocket): PlayerClient;
    assign(clientId: string, player: Player): void
    find(clientId: string): PlayerClient | undefined;
    findAll(): PlayerClient[];
    delete(clientId: string): void;
    clearAll(): void;
}

export class SimplePlayerClientService implements PlayerClientService {


    private clientMap = new Map<string, PlayerClient>();

    findAll(): PlayerClient[] {
        return Array.from(this.clientMap.values());
    }

    add(clientId: string, websocket: WebSocket): PlayerClient {

        let newClient: PlayerClient = {
            id: clientId,
            ws: websocket,
            player: undefined
        }

        this.clientMap.set(clientId, newClient);

        return newClient;
    }

    assign(clientId: string, player: Player): void {

        let foundClient = this.clientMap.get(clientId);
        if (foundClient) {
            foundClient.player = player
            this.clientMap.set(clientId, foundClient);
        } else {
            console.error(`Client with id [${clientId}] not found`);
        }
    }

    find(clientId: string): PlayerClient | undefined {
        return this.clientMap.get(clientId);
    }

    delete(clientId: string): void {
        this.clientMap.delete(clientId);
    }

    clearAll(): void {
        this.clientMap.clear();
    }
}