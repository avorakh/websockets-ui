import { Room } from './room_svc.js';
import { Player } from './user_svc.js';
import { v4 as uuidv4 } from "uuid";
import { WebSocketEventSender } from './event_sender.js';

export interface Position {
    x: number,
    y: number
}

export interface Ship {
    type: string,
    length: number,
    direction: boolean,
    position: Position
}

export interface GamePlayer {
    idGame: string,
    playerId: string,
    player: Player,
    ships: Ship[] | undefined
}

export interface GameService {
    createGame(room: Room): Promise<void>;
    addShips(gameId: string, playerId: string, ships: Ship[]): Promise<void>;
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
                player: user,
                ships: undefined
            }
            players.push(gamePlayer);
        })
        this.gameMap.set(idGame, players);
        this.eventSender.sendCreateGameEvent(players);
    }

    async addShips(gameId: string, playerId: string, ships: Ship[]): Promise<void> {

        let foundPlayers = this.gameMap.get(gameId);
        if (foundPlayers) {

            for (let index = 0; index < foundPlayers.length; index++) {
                let currentPlayer = foundPlayers[index];
                if (currentPlayer.playerId === playerId) {
                    currentPlayer.ships = ships;
                    foundPlayers[index] = currentPlayer;
                    this.gameMap.set(gameId, foundPlayers);
                    console.log(`Ships were added to the player with ID - [${playerId}] in the game with ID - [${gameId}]`);
                    break
                }
            }

            let bothPlayersAddedShips = true;
            for (let index = 0; index < foundPlayers.length; index++) {
                let currentPlayer = foundPlayers[index];
                if (!currentPlayer.ships) {
                    bothPlayersAddedShips = false;
                    break;
                }
            }
            if (bothPlayersAddedShips) {
                await this.eventSender.sendStartGameEvent(foundPlayers);
                await this.eventSender.sendTurnEvent(foundPlayers, playerId);
            } else {
                console.error(`The game with ID is not ready- [${gameId}]`);
            }
        } else {
            console.error(`Unable find the game with ID - [${gameId}]`);
        }
    }
}