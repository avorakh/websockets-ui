import { Room } from './room_svc.js';
import { Player } from './user_svc.js';
import { WebSocketEventSender } from './event_sender.js';
import { WinnerService } from './winner_svc.js';


let generateId = (length: number = 6): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}


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
    private shotPositions: Map<string, Position> = new Map();
    private availableShips: Map<string, boolean> = new Map();

    constructor() {
        this.boardSize = 10;
        this.shipPositions = new Map();
        this.shipStates = new Map();
    }

    addShips(ships: Ship[]): void {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                this.shotPositions.set(`${i},${j}`, { x: i, y: j });
            }
        }

        ships.forEach((ship, index) => {
            const shipName = `${ship.type}_${index}`;

            this.availableShips.set(shipName, true)

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
        this.shotPositions.delete(positionKey);
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
            this.availableShips.delete(shipName)
            return "killed";
        }

        return "shot";
    }

    getRandomPosition(): Position | undefined {
        const valuesArray = Array.from(this.shotPositions.values());
        if (valuesArray.length === 0) {
            return undefined;
        }
        const randomIndex = Math.floor(Math.random() * valuesArray.length);
        return valuesArray[randomIndex];
    }

    isLost(): boolean {
        return this.availableShips.size === 0;
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
    randomAttack(gameId: string, playerId: string): Promise<void>
}

export class SimpleGameService implements GameService {

    private gameMap: Map<string, GamePlayer[]> = new Map<string, GamePlayer[]>();
    private gameBoardMap: Map<string, BattleshipBoard> = new Map<string, BattleshipBoard>();
    private eventSender: WebSocketEventSender;
    private winnerService: WinnerService;

    constructor(eventSender: WebSocketEventSender, winnerService: WinnerService) {
        this.eventSender = eventSender;
        this.winnerService = winnerService;
    }


    async createGame(room: Room): Promise<void> {

        let idGame: string = `Game.${generateId()}`;
        let players: GamePlayer[] = [];

        room.roomUsers.forEach(user => {
            let playerId: string = `${idGame}-${user.name}`;
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

        if (foundPlayers && foundPlayers.length === 2) {
            let enemyPlayer = foundPlayers.find(player => player.playerId !== playerId);
            if (!enemyPlayer) {
                console.log(`Unable to find enemy player gameId-[${gameId}], playerId-[${playerId}]`);
                return;
            }
            let enemyPlayerId = enemyPlayer.playerId;
            let enemyBoard = this.gameBoardMap.get(enemyPlayerId);
            if (!enemyBoard) {
                console.log(`Unable to find enemy board gameId-[${gameId}], enemy playerId-[${enemyPlayerId}]`);
                return;
            }
            let { x, y } = position;
            let shotResult = enemyBoard.verifyShot(x, y);

            this.gameBoardMap.set(enemyPlayerId, enemyBoard)
            console.log(`Sho Result -[${shotResult}] for gameId-[${gameId}], playerId-[${playerId}], position-[${JSON.stringify(position)}]`);
            if (!shotResult) {
                console.log(`Unable to Handle attack result gameId-[${gameId}], playerId-[${playerId}], position-[${JSON.stringify(position)}]`);
                return;
            }
            await this.eventSender.sendAttackEvent(foundPlayers, {
                position: position,
                currentPlayer: playerId,
                status: shotResult
            });

            if (enemyBoard.isLost()) {
                this.eventSender.sendFinishGameEvent(foundPlayers, playerId);
                let winner = foundPlayers.find(player => player.playerId === playerId);

                if (winner) {
                    console.log(` playerId-[${playerId}] won in gameId-[${gameId}]`);
                    await this.winnerService.addWin(winner.player.name);
                }

                await this.eventSender.sendUpdateWinnersEvent()
                return;
            }
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


    async randomAttack(gameId: string, playerId: string): Promise<void> {
        console.log(`Unable to find enemy board gameId-[${gameId}],  playerId-[${playerId}]`);
        let foundPlayers = this.gameMap.get(gameId);

        if (foundPlayers && foundPlayers.length === 2) {
            let enemyPlayer = foundPlayers.find(player => player.playerId !== playerId);
            if (!enemyPlayer) {
                console.log(`Unable to find enemy player gameId-[${gameId}], playerId-[${playerId}]`);
                return;
            }
            let enemyPlayerId = enemyPlayer.playerId;
            let enemyBoard = this.gameBoardMap.get(enemyPlayerId);
            if (!enemyBoard) {
                console.log(`Unable to find enemy board gameId-[${gameId}], enemy playerId-[${enemyPlayerId}]`);
                return;
            }
            let randomPosition = enemyBoard.getRandomPosition()

            if (!randomPosition) {
                console.log(`Unable to random possition gameId-[${gameId}], enemy playerId-[${enemyPlayerId}]`);
                return;
            }

            let { x, y } = randomPosition;
            let shotResult = enemyBoard.verifyShot(x, y);

            this.gameBoardMap.set(enemyPlayerId, enemyBoard)
            console.log(`Shot Result -[${shotResult}] for gameId-[${gameId}], playerId-[${playerId}], position-[${JSON.stringify(randomPosition)}]`);
            if (!shotResult) {
                console.log(`Unable to Handle attack result gameId-[${gameId}], playerId-[${playerId}], position-[${JSON.stringify(randomPosition)}]`);
                return;
            }
            await this.eventSender.sendAttackEvent(foundPlayers, {
                position: randomPosition,
                currentPlayer: playerId,
                status: shotResult
            });
            if (enemyBoard.isLost()) {
                this.eventSender.sendFinishGameEvent(foundPlayers, playerId);
                let winner = foundPlayers.find(player => player.playerId === playerId);

                if (winner) {
                    console.log(` playerId-[${playerId}] won in gameId-[${gameId}]`);
                    await this.winnerService.addWin(winner.player.name);
                }

                await this.eventSender.sendUpdateWinnersEvent()
                return;
            }
            switch (shotResult) {
                case "shot":
                case "killed":
                    await this.eventSender.sendTurnEvent(foundPlayers, playerId);
                    break;
                case 'miss':
                    await this.eventSender.sendTurnEvent(foundPlayers, enemyPlayerId);
                    break;
                default:
                    console.log(`Unable to Handle attack gameId-[${gameId}], playerId-[${playerId}], position-[${JSON.stringify(randomPosition)}]`);
            }

        } else {
            console.log(`Handle  random attack gameId-[${gameId}], playerId-[${playerId}]`);
        }
    }

}