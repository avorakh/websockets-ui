import { WebSocket } from 'ws';
import { Command } from '../command/commands.js';
import { CommandHandler } from './command_svc.js';
import { GameService, Ship } from './geme_svc.js';


export interface Attack {
    gameId: string,
    indexPlayer: string
    x: number,
    y: number
}

const toAttack = (msg: string): Attack => {
    let event: Attack = JSON.parse(msg)
    return event;
}


export class AttackCommandHandler implements CommandHandler {
    private gameService: GameService;
    constructor(gameService: GameService) {
        this.gameService = gameService;
    }

    canHandle(command: Command): boolean {
        return command.type === 'attack'
    }

    async handle(command: Command, ws: WebSocket, clientId: string): Promise<void> {
        let attackEvent: Attack = toAttack(command.data);
        this.gameService.attack(attackEvent.gameId, attackEvent.indexPlayer, { x: attackEvent.x, y: attackEvent.y });
    }
} 