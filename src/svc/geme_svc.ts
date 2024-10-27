import { Room } from './room_svc.js';
import { Player } from './user_svc.js';
import { v4 as uuidv4 } from "uuid";
import { WebSocketEventSender } from './event_sender.js';

export interface GamePlayer {
    idGame: string,
    playerId: string
    player: Player
}

export interface GameService {
    createGame(room: Room): Promise<void>;
}

export class SimpleGameService implements GameService {

    private gameMap = new Map<string, GamePlayer[]>();
    private eventSender: WebSocketEventSender;

    constructor(eventSender: WebSocketEventSender) {
        this.eventSender = eventSender;
    }

    async createGame(room: Room): Promise<void> {

        let idGame: string = `${room.roomId}_${uuidv4()}`;
        let players: GamePlayer[] = [];

        room.roomUsers.forEach(user => {
            let playerId: string = `${idGame}_${user.index}`;
            let gamePlayer: GamePlayer = {
                idGame: idGame,
                playerId: playerId,
                player: user
            }
            players.push(gamePlayer);
        })
        this.gameMap.set(idGame, players);
        this.eventSender.sendCreateGameEvent(players);
    }
}