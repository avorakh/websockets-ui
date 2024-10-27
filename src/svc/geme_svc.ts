import { Room } from './room_svc.js';
import { Player } from './user_svc.js';
import { v4 as uuidv4 } from "uuid";
import { WebSocketEventSender } from './event_sender.js';

export type Position = {
    x: number,
    y: number
}

export type Ship = {
    type: string,
    length: number,
    direction: boolean,
    position: Position
}

export type GamePlayer = {
    idGame: string,
    playerId: string,
    player: Player,
    ships: Ship[] | undefined
}

export type ShipState = {
    positions: Map<string, boolean>;
    length: number;
    hits: number;
};


class BattleshipBoard {
    private boardSize: number;
    private shipPositions: Map<string, string>;
    private shipStates: Map<string, ShipState>;

    constructor(boardSize: number = 10) {
        this.boardSize = boardSize;
        this.shipPositions = new Map();
        this.shipStates = new Map();
    }

    addShips(ships: Ship[]): void {
        ships.forEach((ship, index) => {
            const shipName = `${ship.type}_${index}`;
            const shipState: ShipState = {
                positions: new Map(),
                length: ship.length,
                hits: 0
            };

            for (let i = 0; i < ship.length; i++) {
                const x = ship.position.x + (ship.direction ? 0 : i);
                const y = ship.position.y + (ship.direction ? i : 0);

                if (x >= this.boardSize || y >= this.boardSize) {
                    console.log(`Ship ${shipName} is out of bounds.`);
                    return;
                }

                const positionKey = `${x},${y}`;
                if (this.shipPositions.has(positionKey)) {
                    console.log(`Position ${positionKey} is already occupied.`);
                    return;
                }

                this.shipPositions.set(positionKey, shipName);
                shipState.positions.set(positionKey, false);
            }

            this.shipStates.set(shipName, shipState);
        });
  

    }

    verifyShot(x: number, y: number): string | undefined {

        const positionKey = `${x},${y}`;
        const shipName = this.shipPositions.get(positionKey);

        if (!shipName) {
            console.error(`Ship not found` + positionKey);
            return "miss";
        }

        const shipState = this.shipStates.get(shipName);
        if (!shipState) {
            console.log(`Ship ${shipState}state for ${shipName} not found.`);
            return;
        }

        shipState.positions.set(positionKey, true);
        shipState.hits++;
        this.shipStates.set(shipName, shipState);

        if (shipState.hits === shipState.length) {
            return "killed";
        }

        return "shot";
    }
}


export type AttackResults = {
    position: Position,
    currentPlayer: string,
    status: string,
}

export interface GameService {
    createGame(room: Room): Promise<void>;
    addShips(gameId: string, playerId: string, ships: Ship[]): Promise<void>;
    attack(gameId: string, playerId: string, position: Position): Promise<void>;
}

export class SimpleGameService implements GameService {

    private gameMap: Map<string, GamePlayer[]> = new Map<string, GamePlayer[]>();
    private gameBoardMap: Map<string, BattleshipBoard> = new Map<string, BattleshipBoard>();
    private eventSender: WebSocketEventSender;

    constructor(eventSender: WebSocketEventSender) {
        this.eventSender = eventSender;
    }


    async createGame(room: Room): Promise<void> {

        let idGame: string = `${room.roomId}_${uuidv4()}`;
        let players: GamePlayer[] = [];

        room.roomUsers.forEach(user => {
            let playerId: string = `${idGame}_${user.name}`;
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
                    let board = new BattleshipBoard();
                    board.addShips(ships)
                    this.gameBoardMap.set(playerId, board);
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

    async attack(gameId: string, playerId: string, position: Position): Promise<void> {
        console.log(`Unable to find enemy board gameId-[${gameId}],  playerId-[${playerId}]`);
        let foundPlayers = this.gameMap.get(gameId);
     
        if (foundPlayers && foundPlayers.length === 2 ) {
            let enemyPlayer  = foundPlayers.find(player => player.playerId !== playerId);
            if (!enemyPlayer) {
                console.log(`Unable to find enemy player gameId-[${gameId}], playerId-[${playerId}]`);
                return;
            } 
            let  enemyPlayerId = enemyPlayer.playerId;
            let board = this.gameBoardMap.get(enemyPlayerId);
            if (!board) {
                console.log(`Unable to find enemy board gameId-[${gameId}], enemy playerId-[${enemyPlayerId}]`);
                return;
            }
            let { x, y } = position;
            let shotResult = board.verifyShot(x, y);

            this.gameBoardMap.set(playerId, board)
            console.log(`Sho Result -[${shotResult}] for gameId-[${gameId}], playerId-[${playerId}], position-[${JSON.stringify(position)}]`);
            if (!shotResult) {
                console.log(`Unable to Handle attack result gameId-[${gameId}], playerId-[${playerId}], position-[${JSON.stringify(position)}]`);
                return;
            }
            this.eventSender.sendAttackEvent(foundPlayers, {
                position: position,
                currentPlayer: playerId,
                status: shotResult
            });
            switch (shotResult) {
                case "shot":
                case "killed":
                    await this.eventSender.sendTurnEvent(foundPlayers, playerId);
                    break;
                case 'miss':
                    await this.eventSender.sendTurnEvent(foundPlayers, enemyPlayerId);
                    break;
                default:
                    console.log(`Unable to Handle attack gameId-[${gameId}], playerId-[${playerId}], position-[${JSON.stringify(position)}]`);

            }

        } else {
            console.log(`Handle attack gameId-[${gameId}], playerId-[${playerId}], position-[${JSON.stringify(position)}]`);
        }
    }

}