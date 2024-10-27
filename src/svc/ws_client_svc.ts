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
    findByPlayer(player: Player): PlayerClient | undefined;
    findAll(): PlayerClient[];
    delete(clientId: string): void;
    clearAll(): void;
}

export class SimplePlayerClientService implements PlayerClientService {


    private clientMap = new Map<string, PlayerClient>();

    findAll(): PlayerClient[] {
        return Array.from(this.clientMap.values());
    }

    findByPlayer(targetPlayer: Player): PlayerClient | undefined {

        let foundClient;

        this.findAll().forEach(client => {
            if (client.player && client.player.name === targetPlayer.name && client.player.index === targetPlayer.index) {
                console.log("Found Clint")
                foundClient =  client;
            }
        });

        return foundClient;
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